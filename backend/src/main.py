from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth

# 創建資料庫表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SITCON Camp 2025 Backend",
    description="SITCON Camp 2025 後端 API",
    version="0.1.0",
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生產環境中應該限制為特定的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(auth.router)


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
