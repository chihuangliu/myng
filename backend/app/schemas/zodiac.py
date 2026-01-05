from backend.app.services.divination.zodiac.engine import Portrait, DailyTransit
from pydantic import BaseModel


class ZodiacPortraitRequest(BaseModel):
    datetime: str
    city: str | None = None
    coordinates: str | None = None


class ZodiacPortraitResponse(Portrait):
    pass


class ZodiacDailyTransitRequest(BaseModel):
    birth_datetime: str
    birth_coordinates: str
    transit_datetime: str
    current_coordinates: str
    ai_portrait: Portrait | None = None


class ZodiacDailyTransitResponse(DailyTransit):
    pass
