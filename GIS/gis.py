import requests
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

class EmergencyLocator:
    def __init__(self):
        # Initialize geocoder once when the class is loaded
        self.geolocator = Nominatim(user_agent="india_emergency_locator_lib_v1")
        self.average_speed_kmph = 25.0
        self.overpass_url = "http://overpass-api.de/api/interpreter"

    def _get_coordinates(self, location_name: str):
        """Internal helper to get lat/lon from string."""
        try:
            search_query = f"{location_name}, India"
            location = self.geolocator.geocode(search_query)
            if location:
                return location.latitude, location.longitude
            return None, None
        except Exception as e:
            print(f"Geocoding error: {e}")
            return None, None

    def _fetch_amenity_data(self, lat: float, lon: float, amenity_type: str, radius_meters: int = 5000):
        """Internal helper to query OpenStreetMap."""
        query = f"""
        [out:json];
        (
          node["amenity"="{amenity_type}"](around:{radius_meters},{lat},{lon});
          way["amenity"="{amenity_type}"](around:{radius_meters},{lat},{lon});
          relation["amenity"="{amenity_type}"](around:{radius_meters},{lat},{lon});
        );
        out center;
        """
        try:
            response = requests.get(self.overpass_url, params={'data': query}, timeout=20)
            if response.status_code == 200:
                return response.json().get('elements', [])
            return []
        except Exception:
            return []

    def _calculate_metrics(self, user_lat, user_lon, amenity):
        """Calculates distance and estimated time of arrival."""
        # Extract coordinates based on OSM data structure
        if 'lat' in amenity:
            am_lat, am_lon = amenity['lat'], amenity['lon']
        elif 'center' in amenity:
            am_lat, am_lon = amenity['center']['lat'], amenity['center']['lon']
        else:
            return None

        distance_km = geodesic((user_lat, user_lon), (am_lat, am_lon)).kilometers
        
        # 1.3x multiplier for road winding factor
        effective_distance = distance_km * 1.3
        eta_minutes = (effective_distance / self.average_speed_kmph) * 60
        
        name = amenity.get('tags', {}).get('name', 'Unknown Name')
        
        return {
            "name": name,
            "latitude": am_lat,
            "longitude": am_lon,
            "distance_km": distance_km,
            "eta_minutes": eta_minutes
        }

    def find_services(self, location_name: str) -> dict:
        """
        The main function to call. 
        Input: Location string (e.g. 'Pune')
        Output: Dictionary containing nearest Fire, Police, and Hospital.
        """
        lat, lon = self._get_coordinates(location_name)
        
        if not lat:
            return {"error": "Location not found", "success": False}

        results = {
            "success": True,
            "input_location": location_name,
            "coordinates": {"lat": lat, "lon": lon},
            "services": {}
        }

        amenities_map = {
            "Fire Station": "fire_station",
            "Police Station": "police",
            "Hospital": "hospital"
        }

        for label, osm_tag in amenities_map.items():
            raw_data = self._fetch_amenity_data(lat, lon, osm_tag)
            
            candidates = []
            for item in raw_data:
                details = self._calculate_metrics(lat, lon, item)
                if details:
                    candidates.append(details)
            
            if candidates:
                # Sort by distance (ascending)
                candidates.sort(key=lambda x: x['distance_km'])
                nearest = candidates[0]
                
                results["services"][label] = {
                    "Name": nearest['name'],
                    "Latitude": nearest['latitude'],
                    "Longitude": nearest['longitude'],
                    "Distance": f"{nearest['distance_km']:.2f} km",
                    "ETA": f"{nearest['eta_minutes']:.1f} mins"
                }
            else:
                results["services"][label] = None

        return results