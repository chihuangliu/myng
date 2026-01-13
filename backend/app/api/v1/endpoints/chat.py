from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.services.chat_agent import ZodiacAgent

router = APIRouter()


@router.post("/chat")
async def chat_with_zodiac_agent(request: ChatRequest) -> ChatResponse:
    # ... existing code ...
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


@router.post("/chat/stream")
async def chat_with_zodiac_agent_stream(request: ChatRequest):
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

        def event_generator():
            for token in agent.chat_stream(history):
                yield token

        return StreamingResponse(event_generator(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

