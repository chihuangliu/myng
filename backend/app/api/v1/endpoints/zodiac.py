from fastapi import APIRouter, HTTPException
from backend.app.services.divination.zodiac.engine import ZodiacEngine
from backend.app.schemas.zodiac import ZodiacPortraitRequest

router = APIRouter()
engine = ZodiacEngine()


@router.post("/divination/zodiac/portrait")
async def get_ai_portrait(request: ZodiacPortraitRequest):
    try:
        portrait = engine.get_ai_portrait(request.datetime, request.coordinates)
        return {"content": portrait}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
