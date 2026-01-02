from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.router import api_router
from dotenv import load_dotenv

load_dotenv()

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
    return {"message": "Welcome to Myng API"}
