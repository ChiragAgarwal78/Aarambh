import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
# Changed import to generic 'g' assuming files are in same folder. 
# If 'g.py' is in a 'GIS' folder, use: from GIS.g import ...
from GIS.g import get_coordinates, geolocator, fetch_nearest_amenity, calculate_details
import requests
import math
from rag import build_rag_chain
from contextlib import asynccontextmanager

ai_brain = None

# --- Lifespan Manager ---
# This runs once when the server starts/stops
@asynccontextmanager
async def lifespan(app: FastAPI):
    global ai_brain
    # Load the model on startup
    ai_brain = build_rag_chain()
    yield
    # Clean up (optional)
    ai_brain = None

app = FastAPI(title="Aarambh")

class ChatRequest(BaseModel):
    query: str
    session_id: str = "default_user"

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    """
    Talk to the RAG AI.
    """
    global ai_brain
    
    if ai_brain is None:
        raise HTTPException(status_code=503, detail="AI System is not initialized (Check server logs).")

    try:
        # Invoke the chain imported from rag.py
        response = ai_brain.invoke(
            {"input": request.query},
            config={"configurable": {"session_id": request.session_id}}
        )
        return {"response": response["answer"]}
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Internal AI Error")


@app.get("/get_nearest_service_location")
def find_emergency_services(location: str):
    """
    Main endpoint. Takes a location string, returns nearest Fire, Police, and Hospital.
    """
    # 1. Geocode the input
    lat, lon = get_coordinates(location)
    
    if not lat:
        raise HTTPException(status_code=404, detail="Location not found. Please try being more specific (e.g., 'Sector 18, Noida').")

    results = {
        "input_location": location,
        "coordinates": {"lat": lat, "lon": lon},
        "services": {}
    }

    # 2. Define amenities to look for (OSM tags)
    amenities = {
        "Fire Station": "fire_station",
        "Police Station": "police",
        "Hospital": "hospital"
    }

    # 3. Fetch and process each amenity
    for label, osm_tag in amenities.items():
        raw_data = fetch_nearest_amenity(lat, lon, osm_tag)
        
        candidates = []
        for item in raw_data:
            details = calculate_details(lat, lon, item)
            if details:
                candidates.append(details)
        
        # Sort by distance and pick the nearest one
        if candidates:
            candidates.sort(key=lambda x: x['distance_km'])
            nearest = candidates[0]
            results["services"][label] = {
                "Name": nearest['name'],
                "Latitude": nearest['latitude'],
                "Longitude": nearest['longitude'],
                "Distance": f"{nearest['distance_km']} km",
                "ETA": f"{nearest['eta_minutes']} mins (approx)"
            }
        else:
            results["services"][label] = "No service found within 5km range."

    return results



if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)