# chat_ui.py
import streamlit as st
import requests
import json
import uuid # Library for generating a unique ID

st.set_page_config(page_title="Emergency AI Agent", layout="wide")

# -----------------------------------
# SESSION STATE
# -----------------------------------
if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "assistant", "content": "112, what is your emergency?"}]

if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4()) # Generate a unique ID per session

st.title("🚨 Emergency AI Agent Interface")
st.caption(f"Session ID: **{st.session_state.session_id[:8]}...**") # Display for debugging

# Backend endpoint
BACKEND_URL = "http://127.0.0.1:8000/chat" 


def send_message_to_backend(user_msg: str, session_id: str):
    """Send the user's message and session ID to your Agentic pipeline."""
    try:
        response = requests.post(
            BACKEND_URL,
            # IMPORTANT: Send the session_id along with the message
            json={"session_id": session_id, "message": user_msg},
            timeout=60
        )
        if response.status_code == 200:
            return response.json() # Return the full JSON object
        else:
            return {"reply": f"⚠️ Backend Error ({response.status_code}): {response.text}"}
    except Exception as e:
        return {"reply": f"⚠️ Request failed: {str(e)}"}


# -----------------------------------
# DISPLAY CHAT MESSAGES
# -----------------------------------
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# -----------------------------------
# INPUT BOX
# -----------------------------------
if user_input := st.chat_input("Type your message..."):
    # 1. Add user message
    st.session_state.messages.append({"role": "user", "content": user_input})

    with st.chat_message("user"):
        st.markdown(user_input)
    
    with st.spinner("Agent thinking..."):
        # 2. Send to backend with session ID
        backend_response = send_message_to_backend(user_input, st.session_state.session_id)
        reply = backend_response.get("reply", "No response from agent.")
        is_complete = backend_response.get("is_complete", False)
        collected_data = backend_response.get("collected_data")

    # 3. Add bot reply
    st.session_state.messages.append({"role": "assistant", "content": reply})

    with st.chat_message("assistant"):
        st.markdown(reply)

    # 4. Display collected data if complete
    if is_complete:
        st.success("✅ **INFO COMPLETE. we are connecting you to Dispatcher.**")
        #st.json(collected_data)

        # Optionally reset session for new call
        # st.session_state.session_id = str(uuid.uuid4()) 
        # st.session_state.messages = []


# Reset button for testing purposes
if st.sidebar.button("Start New Call"):
    st.session_state.session_id = str(uuid.uuid4())
    st.session_state.messages = [{"role": "assistant", "content": "112, what is your emergency?"}]
    st.rerun()