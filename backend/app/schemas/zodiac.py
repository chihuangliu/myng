from backend.app.services.divination.zodiac.engine import Portrait
from pydantic import BaseModel


class ZodiacPortraitRequest(BaseModel):
    datetime: str
    city: str | None = None
    coordinates: str | None = None


class ZodiacPortraitResponse(Portrait):
    pass
