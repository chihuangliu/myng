from fastapi import APIRouter
from backend.app.api.v1.endpoints import zodiac

api_router = APIRouter()
api_router.include_router(zodiac.router, tags=["zodiac"])
