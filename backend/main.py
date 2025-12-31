from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Myng API", description="AI Divination Backend")

@app.get("/")
async def root():
    return {"message": "Welcome to Myng API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
