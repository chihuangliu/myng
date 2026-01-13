from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.router import api_router
from backend.app.core.logger import setup_logging
import logging
from dotenv import load_dotenv
import os

load_dotenv()

setup_logging(os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)
logger.info("Application starting up")

app = FastAPI(title="Myng API")

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
