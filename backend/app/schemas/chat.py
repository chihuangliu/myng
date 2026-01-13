from pydantic import BaseModel
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    birth_datetime: str
    birth_coordinates: str
    transit_datetime: str
    current_coordinates: Optional[str] = None
    history: List[ChatMessage] = []


class ChatResponse(BaseModel):
    response: str
