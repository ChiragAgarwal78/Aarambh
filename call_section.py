import os
import json
import base64
import asyncio
import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, WebSocket, Request, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from twilio.twiml.voice_response import VoiceResponse, Connect
from websockets.asyncio.client import connect as ws_connect
import httpx
from dotenv import load_dotenv

# --- FLAT IMPORTS (Files in Root) ---
from pipline import run_emergency_pipeline
from agents import EmergencyAgents
from schema import EmergencyInfo, VerificationResult

load_dotenv()

# --- CONFIGURATION ---
router = APIRouter()  # <--- DEFINED HERE, DO NOT IMPORT IT

deepgram_key = os.getenv("DEEPGRAM_API_KEY")
SERVER_DOMAIN = "09bc58cd631d.ngrok-free.app"  # Update with your NGROK URL
BUFFER_DELAY_SECONDS = 1.2
LOG_FILE = "conversation_logs.txt"
REPORTS_DIR = "incident_reports"

# Ensure reports directory exists
os.makedirs(REPORTS_DIR, exist_ok=True)

if not deepgram_key:
    raise ValueError("Missing DEEPGRAM_API_KEY.")

DEEPGRAM_STT_URL = (
    "wss://api.deepgram.com/v1/listen?"
    "encoding=mulaw&sample_rate=8000&channels=1"
    "&smart_formatting=true&interim_results=true&endpointing=300"
)
DEEPGRAM_TTS_URL = "https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mulaw&sample_rate=8000"

def log_to_file(role: str, text: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {role}: {text}\n")

def save_report_to_json(session_id: str, data: dict):
    """Helper to save the collected data to a JSON file."""
    filename = f"{REPORTS_DIR}/report_{session_id}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    print(f"✅ Report saved to: {filename}")

class VoiceCallSession:
    """Manages state for a single phone call."""
    def __init__(self):
        self.stream_sid = None
        self.ai_is_speaking = False
        self.transcript_buffer: List[str] = [] 
        self.buffer_timer: Optional[asyncio.Task] = None 
        
        # Initial Pipeline State
        self.pipeline_state = {
            "transcript": "",
            "collected_data": {},
            "next_question": "911, what is your emergency?",
            "is_complete": False,
            "conversation_history": []
        }

# --- ENDPOINT 1: Twilio Webhook ---
@router.api_route("/incoming_call", methods=["GET", "POST"])
async def handle_incoming_call(request: Request):
    response = VoiceResponse()
    response.say("9 1 1, what is your emergency?") 
    connect_verb = Connect()
    connect_verb.stream(url=f"wss://{SERVER_DOMAIN}/audio_stream")
    response.append(connect_verb)
    return HTMLResponse(content=str(response), media_type="application/xml")

# --- ENDPOINT 2: WebSocket Stream ---
@router.websocket("/audio_stream")
async def audio_stream_endpoint(websocket: WebSocket):
    await websocket.accept()
    session = VoiceCallSession()
    print("Twilio client connected")
    
    deepgram_headers = {"Authorization": f"Token {deepgram_key}"}
    
    try:
        dg_ws = await ws_connect(DEEPGRAM_STT_URL, additional_headers=deepgram_headers)
    except Exception as e:
        print(f"Deepgram connection failed: {e}")
        await websocket.close()
        return

    audio_queue = asyncio.Queue()

    # --- HELPER: PIPELINE & TTS ---
    async def process_pipeline_and_tts(user_text):
        """Runs the LangGraph Pipeline and streams result to TTS."""
        try:
            session.ai_is_speaking = True
            
            # Run sync pipeline in a thread
            new_state = await asyncio.to_thread(
                run_emergency_pipeline, 
                user_text, 
                session.pipeline_state
            )
            
            session.pipeline_state = new_state
            ai_reply = new_state.get("next_question", "")
            
            # Completion Check
            if new_state.get("is_complete", False):
                print(">>> INCIDENT REPORT COMPLETE <<<")
                
                # Save to JSON File
                save_report_to_json(session.stream_sid, new_state.get("collected_data"))
                
                if "dispatch" not in ai_reply.lower():
                    ai_reply += " Dispatching units now."

            clean_reply = re.sub(r'[*_#]', '', ai_reply).strip()
            print(f"[AI Pipeline] {clean_reply}")
            log_to_file("AI", clean_reply)

            # TTS Request
            audio_bytes = await tts_request(clean_reply)
            if audio_bytes:
                payload_base64 = base64.b64encode(audio_bytes).decode("utf-8")
                await audio_queue.put(payload_base64)
                
        except Exception as e:
            print(f"Pipeline/TTS Error: {e}")

    # --- SUB-TASK: BUFFER TIMER ---
    async def process_buffer_after_silence():
        try:
            await asyncio.sleep(BUFFER_DELAY_SECONDS)
            if session.transcript_buffer:
                full_text = " ".join(session.transcript_buffer)
                session.transcript_buffer = [] 
                print(f"[User Final] {full_text}")
                log_to_file("User", full_text)
                await process_pipeline_and_tts(full_text)     
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Buffer Error: {e}")

    # --- SUB-TASK: TWILIO SENDER ---
    async def twilio_sender():
        while True:
            try:
                audio_data = await audio_queue.get()
                if session.stream_sid:
                     await websocket.send_text(json.dumps({
                        "event": "media",
                        "streamSid": session.stream_sid,
                        "media": {"payload": audio_data}
                    }))
            except Exception as e:
                break

    # --- SUB-TASK: TWILIO RECEIVER ---
    async def twilio_receiver():
        try:
            while True:
                msg = await websocket.receive_text()
                data = json.loads(msg)
                event = data.get("event")

                if event == "start":
                    session.stream_sid = data["start"]["streamSid"]
                elif event == "media":
                    audio_bytes = base64.b64decode(data["media"]["payload"])
                    await dg_ws.send(audio_bytes)
                elif event == "stop":
                    print("Twilio stopped.")
                    break
        except WebSocketDisconnect:
            pass
        finally:
            await dg_ws.send(json.dumps([]))

    # --- SUB-TASK: DEEPGRAM PROCESSOR ---
    async def deepgram_processor():
        async for message in dg_ws:
            try:
                data = json.loads(message)
            except:
                continue

            channel_data = data.get("channel")
            if not channel_data or not isinstance(channel_data, dict):
                continue
            
            alternatives = channel_data.get("alternatives")
            if not alternatives:
                continue
            
            transcript = alternatives[0].get("transcript", "").strip()
            is_final = data.get("is_final", False)
            
            # Barge-in
            if transcript and session.ai_is_speaking:
                print(f"Barge-in detected: {transcript}")
                if session.stream_sid:
                    await websocket.send_text(json.dumps({
                        "event": "clear",
                        "streamSid": session.stream_sid
                    }))
                while not audio_queue.empty():
                    try: audio_queue.get_nowait()
                    except asyncio.QueueEmpty: break
                session.ai_is_speaking = False
                if session.buffer_timer:
                    session.buffer_timer.cancel()
                    session.transcript_buffer = []

            # Buffering
            if is_final and transcript:
                print(f"[Buffer Add] {transcript}")
                session.transcript_buffer.append(transcript)
                if session.buffer_timer:
                    session.buffer_timer.cancel()
                session.buffer_timer = asyncio.create_task(process_buffer_after_silence())

    await asyncio.gather(
        twilio_receiver(),
        deepgram_processor(),
        twilio_sender()
    )

async def tts_request(text: str) -> bytes:
    if not text: return b""
    async with httpx.AsyncClient(timeout=10.0) as client_http:
        r = await client_http.post(
            DEEPGRAM_TTS_URL, 
            headers={"Authorization": f"Token {deepgram_key}"},
            json={"text": text}
        )
        return r.content