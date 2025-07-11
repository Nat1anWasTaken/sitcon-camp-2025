# 使用官方 Node.js 18 LTS 版本作為基礎鏡像
FROM node:18-alpine AS base

# 安裝 pnpm
RUN npm install -g pnpm

# 設置工作目錄
WORKDIR /app

# 複製 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 第一階段：安裝依賴
FROM base AS deps
# 安裝所有依賴（包括 devDependencies）
RUN pnpm install --frozen-lockfile

# 第二階段：構建應用
FROM base AS builder
# 複製依賴
COPY --from=deps /app/node_modules ./node_modules
# 複製源代碼
COPY . .

# 設置環境變量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 構建應用
RUN pnpm build

# 第三階段：生產環境
FROM node:18-alpine AS runner

# 安裝 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 設置環境變量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 創建 nextjs 用戶
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製 public 資料夾
COPY --from=builder /app/public ./public

# 設置正確的權限並複製應用輸出
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 複製 Next.js 構建輸出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切換到 nextjs 用戶
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 啟動應用
CMD ["node", "server.js"] 