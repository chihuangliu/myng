from fastapi import APIRouter, HTTPException
from backend.app.services.divination.zodiac.engine import ZodiacEngine
from backend.app.schemas.zodiac import (
    ZodiacPortraitRequest,
    ZodiacPortraitResponse,
    ZodiacDailyTransitRequest,
    ZodiacDailyTransitResponse,
)

from backend.app.core.location import get_coordinates

router = APIRouter()
engine = ZodiacEngine()


@router.post("/divination/zodiac/portrait")
async def get_ai_portrait(request: ZodiacPortraitRequest) -> ZodiacPortraitResponse:
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
        return engine.get_ai_portrait(request.datetime, coordinates)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/divination/zodiac/daily-transit")
async def get_ai_daily_transit(
    request: ZodiacDailyTransitRequest,
) -> ZodiacDailyTransitResponse:
    return engine.get_ai_daily_transit(
        birth_datetime=request.birth_datetime,
        birth_coordinates=request.birth_coordinates,
        transit_datetime=request.transit_datetime,
        current_coordinates=request.current_coordinates,
        ai_portrait=request.ai_portrait,
    )
