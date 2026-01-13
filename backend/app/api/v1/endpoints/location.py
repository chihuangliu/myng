from fastapi import APIRouter, HTTPException
from backend.app.core.location import get_coordinates, get_timezone, GeopyError
from pydantic import BaseModel
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter()

class LocationResponse(BaseModel):
    coordinates: str

class LocalizeRequest(BaseModel):
    date_str: str  # Naive ISO string "YYYY-MM-DDTHH:MM:SS"
    city: str

class LocalizeResponse(BaseModel):
    datetime: str  # ISO string with offset
    timezone: str
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

@router.post("/localize")
async def localize_datetime(request: LocalizeRequest) -> LocalizeResponse:
    try:
        # 1. Get Coordinates
        coordinates = get_coordinates(request.city)
        if not coordinates:
            raise HTTPException(status_code=404, detail=f"Location not found: {request.city}")
        
        lat, lng = map(float, coordinates.split(","))
        
        # 2. Get Timezone
        tz_name = get_timezone(lat, lng)
        if not tz_name:
            raise HTTPException(status_code=404, detail="Timezone not found for location")
            
        # 3. Localize
        try:
            # Parse naive string
            dt = datetime.fromisoformat(request.date_str)
            # Attach timezone
            tz = ZoneInfo(tz_name)
            dt_aware = dt.replace(tzinfo=tz)
            
            return LocalizeResponse(
                datetime=dt_aware.isoformat(),
                timezone=tz_name,
                coordinates=coordinates
            )
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid date format. Expected ISO (YYYY-MM-DDTHH:MM:SS)")
             
    except GeopyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
