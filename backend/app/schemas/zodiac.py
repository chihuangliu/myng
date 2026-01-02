from pydantic import BaseModel


class ZodiacPortraitRequest(BaseModel):
    datetime: str
    coordinates: str
