from pydantic import BaseModel


class ZodiacPortraitRequest(BaseModel):
    datetime: str
    city: str | None = None
    coordinates: str | None = None
