# SITCON Camp 2025

2025 年 SITCON CAMP 第四小隊的黑客松專案。

## Docker 部署

### 系統需求

- Docker
- Docker Compose

### 啟動服務

1. 克隆專案

```bash
git clone <repository-url>
cd sitcon-camp-2025
```

2. 修改環境變數

   將 `frontend.env.example` 和 `backend.env.example` 複製為 `frontend.env` 和 `backend.env`
   編輯 `frontend.env` 和 `backend.env` 中的環境變數
   **請只更動你看得懂的部分，剩下的維持原樣**

   例如：

   ```bash
   cp frontend.env.example frontend.env
   cp backend.env.example backend.env
   ```

3. 確保您的主機已安裝 Docker 並執行：

```bash
docker compose up
```

### 服務地址

- 前端：http://localhost:3000
- 後端：http://localhost:8000
- MinIO 控制台：http://localhost:9001 (帳號：minioadmin / minioadmin)

### 停止服務

```bash
docker-compose down
```
