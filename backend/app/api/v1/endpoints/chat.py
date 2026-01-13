from fastapi import APIRouter, HTTPException
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.services.chat_agent import ZodiacAgent

router = APIRouter()


@router.post("/chat")
async def chat_with_zodiac_agent(request: ChatRequest) -> ChatResponse:
    try:
        user_context = {
            "birth_datetime": request.birth_datetime,
            "birth_coordinates": request.birth_coordinates,
            "current_coordinates": request.current_coordinates,
            "transit_datetime": request.transit_datetime,
        }

        agent = ZodiacAgent(user_context)

        history = [msg.model_dump() for msg in request.history]

        history.append({"role": "user", "content": request.message})

        response_text = agent.chat(history)

        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
