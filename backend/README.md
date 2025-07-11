# Backend

SITCON CAMP 2025 第四組黑客松專案的後端，使用 FastAPI

## 系統需求

- Python 3.12 或更高版本
- uv (Python 包管理工具)
- Google Cloud Platform 帳戶 (用於 Gemini AI 功能)

## 安裝

### 1. 安裝 uv (如果尚未安裝)

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. 安裝專案依賴

```bash
# 切換到 backend 目錄
cd backend

# 安裝依賴
uv sync
```

### 3. 環境變數設置

創建 `.env` 檔案並設置以下環境變數：

```bash
# Google Cloud 配置 (AI 聊天功能所需)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# CORS 設置 (可選)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT 設置 (可選)
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**注意**: 使用 AI 聊天功能需要 Google Cloud Platform 帳戶和適當的 Vertex AI 權限。

## 初始化資料庫

資料庫會在首次啟動應用程式時自動初始化。

主要資料表：

- `users` (使用者) - 包含身份驗證功能

## 啟動應用程式

### 開發模式（推薦）

使用開發啟動腳本，支援自動重載：

```bash
uv run python start_dev.py
```

### 一般啟動方式

```bash
uv run uvicorn main:app --reload
```

### 生產模式

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

## API 端點

啟動後可在以下網址存取：

- **API 根目錄**: http://localhost:8000/
- **健康檢查**: http://localhost:8000/health
- **API 文件 (Swagger)**: http://localhost:8000/docs
- **ReDoc 文件**: http://localhost:8000/redoc

### 主要 API 端點

#### 身份驗證相關

- `POST /auth/register` - 用戶註冊
- `POST /auth/login` - 用戶登入
- `GET /auth/@me` - 獲取當前用戶資訊

#### AI 聊天功能

- `POST /chat/` - AI 聊天端點 (需要身份驗證)
  - 支援對話歷史和串流回應
  - 使用 Google Gemini 2.0 Flash 模型

#### 其他端點

- `GET /` - API 根目錄
- `GET /health` - 健康檢查
- `GET /api/v1/hello` - 測試端點

詳細的身份驗證 API 文檔請參考 `AUTH_API.md` 文件。

## 專案結構

```
backend/
├── src/                 # 源代碼目錄
│   ├── __init__.py      # Python 包初始化
│   ├── main.py          # 主應用程式
│   ├── models.py        # 資料庫模型
│   ├── schemas.py       # Pydantic 結構
│   ├── database.py      # 資料庫連接
│   ├── auth.py          # 身份驗證相關
│   ├── genai_utils.py   # AI 生成工具 (Gemini API)
│   └── routers/         # API 路由
│       ├── __init__.py
│       ├── auth.py      # 身份驗證路由
│       └── chat.py      # AI 聊天路由
├── main.py              # 應用程式入口點
├── start_dev.py         # 開發啟動腳本
├── pyproject.toml       # 專案配置
├── AUTH_API.md          # 身份驗證 API 文檔
└── README.md            # 此檔案
```

## 故障排除

### 常見問題

1. **端口被佔用**

   ```bash
   # 查找佔用 8000 端口的程序
   lsof -i :8000

   # 或使用其他端口啟動
   uv run uvicorn main:app --port 8001
   ```

2. **資料庫錯誤**

   ```bash
   # 重新初始化資料庫
   uv run python init_db.py
   ```

3. **依賴問題**

   ```bash
   # 清除並重新安裝依賴
   rm -rf .venv uv.lock
   uv sync
   ```

4. **AI 聊天功能問題**
   - 確認已設置正確的 Google Cloud 環境變數
   - 確認 GCP 專案已啟用 Vertex AI API
   - 確認服務帳戶具有適當的權限

## 開發指南

- 修改程式碼後，開發模式會自動重載
- 新增 API 端點請在 `src/routers/` 目錄中定義對應的路由文件
- 新增資料模型請在 `src/models.py` 中定義
- 新增 Pydantic 結構請在 `src/schemas.py` 中定義
- 身份驗證相關功能請在 `src/auth.py` 中實現
- AI 相關功能請在 `src/genai_utils.py` 中實現
- 資料庫相關配置請在 `src/database.py` 中修改
