from fastapi import APIRouter, HTTPException
from backend.app.core.location import get_coordinates, GeopyError
from pydantic import BaseModel

router = APIRouter()

class LocationResponse(BaseModel):
    coordinates: str

@router.get("/resolve")
async def resolve_location(city: str) -> LocationResponse:
    try:
        coordinates = get_coordinates(city)
        if not coordinates:
             raise HTTPException(status_code=404, detail="Location not found")
        return LocationResponse(coordinates=coordinates)
    except GeopyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
