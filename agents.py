# agents.py
import os
import dotenv
from google import genai
from google.genai import types
from schema import EmergencyInfo, VerificationResult

class EmergencyAgents:
    def __init__(self):
        dotenv.load_dotenv()
        self.client = genai.Client(api_key=os.getenv("GEMINI_API"))
        self.model_id = "gemini-2.0-flash"

    def extractor_node(self, current_transcript: str, existing_data: dict, conversation_history: list) -> EmergencyInfo:
        """Updates the incident report based on the conversation."""
        system_prompt = """
        You are a highly trained 112 Dispatch AI.
        
        CRITICAL EXTRACTION RULES:
        1. **Medical = Danger:** If the user reports a medical crisis (Heart attack, Stroke, Bleeding), the 'immediate_dangers' field MUST NOT be 'N/A' or 'None'. Set it to the condition (e.g., 'Cardiac Event', 'Life Threatening').
        
        2. **Address Normalization:** Convert all locations to "Street/Landmark, City, State". Reject "India" or "City only".
        
        3. **Age Extraction:** Listen carefully for keywords like "boy" (child), "old man" (senior), "baby" (child).
        """

        prompt = f"""
        # History
        {"".join(conversation_history)}

        # Current Data
        {existing_data}
        
        # New Input
        "{current_transcript}"
        
        Update the JSON. Be strict.
        """

        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=EmergencyInfo,
                temperature=0.0
            )
        )
        return response.parsed

    def verifier_node(self, parameters: dict) -> VerificationResult:
        """Audits the data. Now enforces Age Group."""
        system_prompt = """
        You are a Dispatch Supervisor. Audit the data for COMPLETENESS.
        
        VALIDATION CHECKLIST (Add to missing_fields if failed):
        1. **location**: Must be specific (Street + City). Reject broad regions.
        2. **emergency_type**: Must not be 'unknown'.
        3. **immediate_dangers**: 
           - If emergency_type is 'medical', this CANNOT be 'N/A' or 'None'.
           - If fire/police, must be specific.
        4. **age_group**: Must not be 'unknown'. (Crucial for dispatching correct units).
        5. **caller_name**: Must not be 'N/A'.
        
        Return the list of missing fields.
        """

        prompt = f"""
        Collected Data: {parameters}
        
        Perform Audit.
        """

        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=VerificationResult,
                temperature=0.0
            )
        )
        return response.parsed

    def question_node(self, missing_field: str, conversation_history: list) -> str:
        """Generates professional questions."""
        system_prompt = """
        You are a 911 Operator. Ask ONE direct question for the missing field.
        Tone: Professional, Efficient, Calm.
        """
        
        prompt = f"""
        Missing Field: {missing_field}
        History: {conversation_history[-2:] if conversation_history else 'None'}
        
        Directives:
        - If 'age_group' missing: "Approximate age of the patient?"
        - If 'immediate_dangers' missing (and it's medical): "Is the patient conscious and breathing?"
        - If 'location' missing: "State the exact address, including city."
        
        Generate Question:
        """
        
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=50,
                temperature=0.1
            )
        )
        return response.text.strip()