import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# --- FLAT IMPORTS ---
from pipline import run_emergency_pipeline
from call_section import router as voice_router

load_dotenv()

app = FastAPI()

# Mount the Voice Router
app.include_router(voice_router)

# Ensure reports directory exists (Mirroring logic in call_section)
REPORTS_DIR = "incident_reports"
os.makedirs(REPORTS_DIR, exist_ok=True)

def save_report_to_json(session_id: str, data: dict):
    """Helper to save the collected data to a JSON file."""
    filename = f"{REPORTS_DIR}/report_{session_id}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    print(f"✅ Text Chat Report saved to: {filename}")

@app.get("/", response_class=JSONResponse)
async def index_page():
    return {"message": "Server is up. Use /chat for text or call the Twilio number."}

# ==========================================
# TEXT CHAT ENDPOINT (FOR TESTING)
# ==========================================

active_text_sessions = {}

class ChatInput(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    reply: str
    is_complete: bool
    collected_data: dict | None = None

@app.post("/chat", response_model=ChatResponse)
async def chat_with_agent(data: ChatInput):
    session_id = data.session_id
    user_message = data.message

    if session_id not in active_text_sessions:
        active_text_sessions[session_id] = {
            "collected_data": {},
            "transcript": "",
            "next_question": "112, what is your emergency?",
            "is_complete": False,
            "conversation_history": []
        }

    current_state = active_text_sessions[session_id]
    
    try:
        updated_state = run_emergency_pipeline(user_message, current_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    active_text_sessions[session_id] = updated_state

    # --- SAVE JSON LOGIC FOR TEXT CHAT ---
    if updated_state.get("is_complete", False):
        save_report_to_json(session_id, updated_state.get("collected_data", {}))
        # Optional: Clean up memory after saving
        # del active_text_sessions[session_id]

    return ChatResponse(
        reply=updated_state["next_question"],
        is_complete=updated_state["is_complete"],
        collected_data=updated_state["collected_data"] if updated_state["is_complete"] else None
    )

if __name__ == "__main__":
    import uvicorn
    # Using Port 8000. Ensure no other process is running here.
    uvicorn.run(app, host="127.0.0.1", port=8000)