# schema.py
from pydantic import BaseModel, Field
from typing import Optional, Literal, List

class EmergencyInfo(BaseModel):
    caller_name: Optional[str] = Field(
        description="Full name of the caller/reporter.", 
        default="N/A"
    )
    emergency_type: Optional[Literal["medical", "fire", "police", "traffic_accident", "hazmat", "unknown"]] = Field(
        description="Categorize the emergency.", 
        default="unknown"
    )
    location: Optional[str] = Field(
        description="The DISPATCHABLE address. Must include Street/Landmark AND City/Region. Reject broad inputs like 'India'.", 
        default="N/A"
    )
    number_of_people_involved: Optional[int] = Field(
        description="Count of people affected.", 
        default=1
    )
    age_group: Optional[Literal["child", "adult", "senior", "mixed", "unknown"]] = Field(
        description="Approximate age of the victim(s). Mandatory for medical cases.", 
        default="unknown"
    )
    immediate_dangers: Optional[str] = Field(
        description="Active threats to life. For Medical cases, this MUST reflect the severity (e.g., 'Cardiac Arrest', 'Unconscious', 'Severe Bleeding'). Do NOT use 'None' for medical emergencies.", 
        default="N/A"
    )
    medical_conditions: Optional[str] = Field(
        description="Specific conditions (e.g., Heart Attack, Stroke, Asthma).", 
        default="N/A"
    )
    description: Optional[str] = Field(
        description="Concise summary of the incident.", 
        default=""
    )

class VerificationResult(BaseModel):
    is_sufficient: bool = Field(description="True ONLY if all critical fields are valid.")
    missing_fields: List[str] = Field(description="List of invalid fields.")