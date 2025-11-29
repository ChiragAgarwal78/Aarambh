import requests  # Added missing import
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

geolocator = Nominatim(user_agent="india_emergency_locator_v1")

# Constants
AVERAGE_SPEED_KMPH = 35.0  # Average driving speed assumption for ETA
OVERPASS_URL = "http://overpass-api.de/api/interpreter"

def get_coordinates(location_name: str):
    """
    Converts a location name (e.g., 'Andheri West, Mumbai') to Lat/Lon.
    """
    try:
        # Appending 'India' helps restrict search context
        search_query = f"{location_name}, India"
        location = geolocator.geocode(search_query)
        if location:
            return location.latitude, location.longitude
        return None, None
    except Exception as e:
        print(f"Geocoding error: {e}")
        return None, None

def fetch_nearest_amenity(lat: float, lon: float, amenity_type: str, radius_meters: int = 5000):
    """
    Queries OpenStreetMap's Overpass API to find nodes of a specific amenity 
    within a given radius.
    """
    # Overpass QL query: Search for nodes with specific amenity around the coordinates
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
        response = requests.get(OVERPASS_URL, params={'data': query}, timeout=20)
        if response.status_code == 200:
            data = response.json()
            return data.get('elements', [])
        else:
            print(f"Overpass API Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"Connection error to Overpass API: {e}")
        return []

def calculate_details(user_lat, user_lon, amenity):
    """
    Extracts name, calculates distance and ETA for a found amenity.
    """
    # Get amenity coordinates (nodes have lat/lon, ways/relations have 'center')
    if 'lat' in amenity:
        am_lat, am_lon = amenity['lat'], amenity['lon']
    elif 'center' in amenity:
        am_lat, am_lon = amenity['center']['lat'], amenity['center']['lon']
    else:
        return None # Skip if no coordinates found

    # Calculate Geodesic Distance (Straight line) in Kilometers
    distance_km = geodesic((user_lat, user_lon), (am_lat, am_lon)).kilometers
    
    # Estimate ETA (Time = Distance / Speed) * 60 for minutes
    # Adding a 1.3x multiplier to account for road winding vs straight line
    effective_distance = distance_km * 1.3
    eta_minutes = (effective_distance / AVERAGE_SPEED_KMPH) * 60
    
    # Get Name or fallback to generic tag
    name = amenity.get('tags', {}).get('name', 'Unknown Name')
    
    return {
        "name": name,
        "latitude": am_lat,
        "longitude": am_lon,
        "distance_km": round(distance_km, 2),
        "eta_minutes": round(eta_minutes, 1)
    }