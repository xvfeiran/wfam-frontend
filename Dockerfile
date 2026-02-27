# 构建阶段
FROM docker.production.tmp-service.bosch.com/node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* .npmrc ./

# 安装依赖
RUN npm install --loglevel warn

# 复制源代码
COPY . .

# 构建模式：production（默认）/ test
# 对应加载 .env.production / .env.test，再叠加 .env 中的默认值
ARG BUILD_MODE=test
RUN npm run build -- --mode ${BUILD_MODE}

# 运行阶段
FROM docker.production.tmp-service.bosch.com/nginx:alpine

# 复制构建产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置（无运行时变量，直接使用）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
