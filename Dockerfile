# 构建阶段
FROM docker.production.tmp-service.bosch.com/node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* .npmrc ./

# 安装依赖
RUN npm install --loglevel warn

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 运行阶段
FROM docker.production.tmp-service.bosch.com/nginx:alpine

# 复制构建产物到 Nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置模板
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# 暴露端口
EXPOSE 80

# 启动时用 envsubst 将 BACKEND_URL 注入配置，再启动 nginx
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
