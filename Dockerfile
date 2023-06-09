FROM golang:1.20-alpine AS builder

# 安装所需的软件包
RUN apk update && apk add --no-cache git

# 克隆NEXTTRACE源代码并编译
WORKDIR /build
RUN git clone --branch v1.1.7-1 --depth 1 https://github.com/sjlleo/nexttrace-core.git . && \
    go clean -modcache && \
    go mod download && \
    go build -o nexttrace .

FROM alpine:3

# 安装所需的软件包
RUN apk update && apk add --no-cache python3 py3-pip nginx

# 安装Python依赖包
COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

# 从构建阶段复制NEXTTRACE二进制文件到最终镜像
COPY --from=builder /build/nexttrace /usr/local/bin/nexttrace
RUN chmod +x /usr/local/bin/nexttrace

# 复制应用程序文件
COPY app.py /app/app.py

# 复制templates和assets文件夹
COPY templates /app/templates
COPY assets /app/assets

# 配置Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# 设置工作目录
WORKDIR /app

# Copy start.sh to the container
COPY start.sh /app/start.sh

EXPOSE 30080

# Use start.sh to start Python app and Nginx
CMD ["/app/start.sh"]
