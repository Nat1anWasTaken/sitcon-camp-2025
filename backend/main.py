import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database import Base, engine
from src.routers import auth, chat, contact, record

load_dotenv()

# 建立資料庫表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SITCON Camp 2025 Backend",
    description="SITCON Camp 2025 後端 API",
    version="0.1.0",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

if not allowed_origins:
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(contact.router)
app.include_router(record.router)


@app.get("/")
async def root():
    """
    根路徑 - 返回 API 基本資訊
    """
    return {
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """
    健康檢查端點
    """
    return {"status": "healthy"}


@app.get("/api/v1/hello")
async def hello():
    """
    測試端點
    """
    return {"message": "Hello from SITCON Camp 2025 Backend!"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
