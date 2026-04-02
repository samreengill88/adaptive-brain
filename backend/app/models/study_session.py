from pydantic import BaseModel
from typing import Optional, List

# data expected by API
class StudySessionCreate(BaseModel):
    user_id: str
    original_text: str
    selected_mode: str
    preferred_outputs: Optional[List[str]] = []
    file_path: Optional[str] = None