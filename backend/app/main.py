from dotenv import load_dotenv

load_dotenv(override=True)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from backend.app.api.v1.router import api_router  # noqa: E402
from backend.app.core.logger import setup_logging  # noqa: E402
import logging  # noqa: E402
import os  # noqa: E402


setup_logging(os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)
logger.info("Application starting up")

app = FastAPI(title="Myng API")
# log all environment variables in .env file
# Configure CORS
origins = ["*"]  # Allow all origins for development

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
def read_root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to Myng API"}
