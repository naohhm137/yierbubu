# ============================================================
# 一二布布：萌境奇旅 — 多阶段 Docker 构建
# 前端构建 + 后端运行，单容器部署
# ============================================================

# ---- 阶段 1: 构建前端 ----
FROM node:20-alpine AS web-builder
WORKDIR /app

# 安装依赖（利用缓存）
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/

RUN npm install --workspaces --include-workspace-root

# 复制源码并构建
COPY . .
RUN npm run build

# ---- 阶段 2: 生产镜像 ----
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# 复制 package 文件
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/

# 仅安装生产依赖
RUN npm install --workspaces --include-workspace-root --omit=dev

# 复制共享源码和服务端源码
COPY packages/shared/src ./packages/shared/src
COPY apps/server/src ./apps/server/src

# 复制前端构建产物
COPY --from=web-builder /app/apps/web/dist ./apps/web/dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["npx", "tsx", "apps/server/src/index.ts"]
