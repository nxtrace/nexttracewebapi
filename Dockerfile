FROM golang:1.21.0-alpine3.18 AS builder

# 安装所需的软件包
RUN apk update && apk add --no-cache git

# 克隆NEXTTRACE源代码并编译
WORKDIR /build
RUN git clone --branch v1.1.7-3-2 --depth 1 https://github.com/nxtrace/Ntrace-V1.git . && \
    go clean -modcache && \
    go mod download && \
    go build -o nexttrace .

FROM ubuntu:22.04

# 安装所需的软件包
RUN apt-get update && apt-get install python3-pip nginx

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
COPY entrypoint.sh /app/entrypoint.sh

EXPOSE 30080

# 设置脚本作为入口点
ENTRYPOINT ["/app/entrypoint.sh"]
