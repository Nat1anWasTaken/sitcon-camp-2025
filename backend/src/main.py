import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth, chat

# 建立資料庫表
Base.metadata.create_all(bind=engine)

load_dotenv()

app = FastAPI(
    title="SITCON Camp 2025 Backend",
    description="SITCON Camp 2025 後端 API",
    version="0.1.0",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split()
if not allowed_origins or allowed_origins == [""]:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)


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

    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
