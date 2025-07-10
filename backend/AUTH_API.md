# SITCON Camp 2025 身份驗證 API 文檔

## 概述

這個身份驗證系統實現了基於 JWT 的安全身份驗證，包含用戶註冊、登入和用戶資訊獲取功能。

## 安全特性

- ✅ **密碼雜湊**: 使用 bcrypt 加密用戶密碼
- ✅ **JWT 令牌**: 使用 HS256 算法的 JWT 令牌認證
- ✅ **輸入驗證**: 使用 Pydantic 進行數據驗證
- ✅ **郵箱驗證**: 驗證郵箱格式的有效性
- ✅ **密碼強度**: 最少 8 個字符的密碼要求
- ✅ **CORS 配置**: 跨源請求支援
- ✅ **SQLite 資料庫**: 本地資料庫存儲

## API 端點

### 1. 用戶註冊

**端點**: `POST /auth/register`

**請求體**:

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "full_name": "用戶全名" // 可選
}
```

**響應** (201 Created):

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "full_name": "用戶全名",
  "is_active": true,
  "created_at": "2025-01-27T12:00:00Z",
  "updated_at": null
}
```

**錯誤響應**:

- `400 Bad Request`: 用戶名或郵箱已存在
- `422 Unprocessable Entity`: 數據驗證失敗

### 2. 用戶登入

**端點**: `POST /auth/login`

**請求體** (application/x-www-form-urlencoded):

```
username=username&password=password123
```

**響應** (200 OK):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**錯誤響應**:

- `401 Unauthorized`: 用戶名或密碼錯誤
- `400 Bad Request`: 用戶帳號已被停用

### 3. 獲取當前用戶資訊

**端點**: `GET /auth/@me`

**請求標頭**:

```
Authorization: Bearer <access_token>
```

**響應** (200 OK):

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "full_name": "用戶全名",
  "is_active": true,
  "created_at": "2025-01-27T12:00:00Z",
  "updated_at": null
}
```

**錯誤響應**:

- `401 Unauthorized`: 令牌無效或過期
- `400 Bad Request`: 用戶帳號已被停用

## 使用示例

### Python (requests)

```python
import requests

# 註冊用戶
register_data = {
    "email": "test@example.com",
    "username": "testuser",
    "password": "securepassword123",
    "full_name": "測試用戶"
}
response = requests.post("http://localhost:8000/auth/register", json=register_data)
print(response.json())

# 登入用戶
login_data = {"username": "testuser", "password": "securepassword123"}
response = requests.post("http://localhost:8000/auth/login", data=login_data)
token = response.json()["access_token"]

# 獲取用戶資訊
headers = {"Authorization": f"Bearer {token}"}
response = requests.get("http://localhost:8000/auth/@me", headers=headers)
print(response.json())
```

### JavaScript (fetch)

```javascript
// 註冊用戶
const registerData = {
  email: "test@example.com",
  username: "testuser",
  password: "securepassword123",
  full_name: "測試用戶",
};

const registerResponse = await fetch("http://localhost:8000/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(registerData),
});

// 登入用戶
const loginData = new URLSearchParams({
  username: "testuser",
  password: "securepassword123",
});

const loginResponse = await fetch("http://localhost:8000/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: loginData,
});

const { access_token } = await loginResponse.json();

// 獲取用戶資訊
const userResponse = await fetch("http://localhost:8000/auth/@me", {
  headers: { Authorization: `Bearer ${access_token}` },
});

const userData = await userResponse.json();
```

## 運行伺服器

```bash
# 安裝依賴
uv sync

# 運行開發伺服器
python main.py
# 或者
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 測試

```bash
# 運行測試腳本（確保伺服器正在運行）
python test_auth.py
```

## 安全注意事項

1. **生產環境配置**:

   - 更改 `SECRET_KEY` 為安全的隨機字符串
   - 限制 CORS `allow_origins` 為特定域名
   - 使用 HTTPS
   - 配置合適的資料庫

2. **令牌管理**:

   - 令牌有效期為 30 分鐘
   - 客戶端應處理令牌過期情況
   - 建議實現令牌刷新機制

3. **密碼策略**:

   - 最少 8 個字符
   - 建議包含大小寫字母、數字和特殊字符

4. **資料庫安全**:
   - 定期備份資料庫
   - 監控異常登入活動
   - 實現帳號鎖定機制

## 資料庫結構

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);
```

## API 文檔

啟動伺服器後，可以在以下地址查看自動生成的 API 文檔：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
