# pipeline.py
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from schema import EmergencyInfo

# Lazily import and cache the agents instance to avoid import-time failures
_agents_instance = None
def get_agents():
    global _agents_instance
    if _agents_instance is None:
        # imported here so missing optional deps in `agents` don't break module import
        from agents import EmergencyAgents
        _agents_instance = EmergencyAgents()
    return _agents_instance

# 1. Define State
class AgentState(TypedDict):
    transcript: str               
    collected_data: dict          
    missing_fields: List[str]     
    next_question: str            
    is_complete: bool             
    conversation_history: List[str] 

agents = None  # kept for backward-compatibility; call get_agents() where needed

# 2. Node Functions

def extraction_step(state: AgentState):
    """Extracts facts from text."""
    current_data = state.get("collected_data", {})
    if not current_data:
        current_data = EmergencyInfo().model_dump()
        
    updated_info = get_agents().extractor_node(
        current_transcript=state['transcript'],
        existing_data=current_data,
        conversation_history=state.get('conversation_history', [])
    )
    return {"collected_data": updated_info.model_dump()}

def verification_step(state: AgentState):
    """Audits data and finds missing fields."""
    current_data = state["collected_data"]
    verification = get_agents().verifier_node(current_data)
    
    return {
        "is_complete": verification.is_sufficient,
        "missing_fields": verification.missing_fields 
    }

def question_generation_step(state: AgentState):
    """Picks the first missing field and generates a question."""
    missing = state.get("missing_fields", [])
    
    if not missing:
        return {"next_question": "Please provide any other relevant details."}
    
    # Priority Queue Strategy
    target_field = missing[0]
    
    question = get_agents().question_node(
        missing_field=target_field,
        conversation_history=state.get('conversation_history', [])
    )
    
    return {"next_question": question}

def update_history_step(state: AgentState):
    """Logs the conversation."""
    history = state.get("conversation_history", [])
    
    if state.get('transcript'):
        history.append(f"Caller: {state['transcript']}")
    
    if not state['is_complete']:
        history.append(f"Operator: {state['next_question']}")

    return {"conversation_history": history}

# 3. Conditional Logic
def check_status(state: AgentState):
    if state["is_complete"]:
        return "dispatch"
    else:
        return "generate_question"

# 4. Build Graph
workflow = StateGraph(AgentState)

workflow.add_node("extractor", extraction_step)
workflow.add_node("verifier", verification_step)
workflow.add_node("question_gen", question_generation_step)
workflow.add_node("history_updater", update_history_step)

workflow.set_entry_point("extractor")

workflow.add_edge("extractor", "verifier")

workflow.add_conditional_edges(
    "verifier",
    check_status,
    {
        "dispatch": "history_updater",
        "generate_question": "question_gen"
    }
)

workflow.add_edge("question_gen", "history_updater")
workflow.add_edge("history_updater", END)

app_graph = workflow.compile()

# 5. Helper function
def run_emergency_pipeline(user_input: str, current_state: dict):
    current_state["transcript"] = user_input
    if "conversation_history" not in current_state:
        current_state["conversation_history"] = []
    
    result = app_graph.invoke(current_state)
    return result