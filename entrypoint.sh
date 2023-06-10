#!/bin/sh

python3 -u app.py &

# 设置默认值
HOSTPORT="${1:-30080}"

# 检查HOSTPORT是否只包含端口号
LISTEN_DIRECTIVE="listen ${HOSTPORT}"

# 修改nginx.conf文件
sed -i "s/listen 30080;/${LISTEN_DIRECTIVE};/" /etc/nginx/nginx.conf

# 启动nginx
exec nginx -g 'daemon off;'
