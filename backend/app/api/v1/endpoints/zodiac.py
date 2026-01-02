from fastapi import APIRouter, HTTPException
from backend.app.services.divination.zodiac.engine import ZodiacEngine
from backend.app.schemas.zodiac import ZodiacPortraitRequest

from backend.app.core.location import get_coordinates

router = APIRouter()
engine = ZodiacEngine()


@router.post("/divination/zodiac/portrait")
async def get_ai_portrait(request: ZodiacPortraitRequest):
    try:
        coordinates = request.coordinates
        if not coordinates:
            if request.city:
                coordinates = get_coordinates(request.city)
                if not coordinates:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Could not resolve coordinates for city: {request.city}",
                    )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Either 'coordinates' or 'city' must be provided.",
                )

        portrait = engine.get_ai_portrait(request.datetime, coordinates)
        return {"content": portrait}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
