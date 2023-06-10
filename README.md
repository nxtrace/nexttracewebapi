<div align="center">

<img src="https://github.com/sjlleo/nexttrace/raw/main/asset/logo.png" height="200px" alt="NextTrace Logo"/>

</div>

# NEXTTRACE WEB API

NEXTTRACE项目派生的仓库，用于实现简易的NEXTTRACE WEB API服务端

![telegram-cloud-photo-size-5-6060028439399872135-y](https://github.com/tsosunchia/nexttracewebapi/assets/59512455/efb07488-79e7-47ed-941e-f2fc174e5c79)

Inspired by PING.PE

感谢PING.PE这么多年来的坚持，让我们能够在这个时候有一个这么好的项目可以参考

## How To Use

推荐使用Docker安装
```bash
docker pull tsosc/nexttraceweb
docker run --network host -d --privileged --name ntwa nexttraceweb
# 使用 http://your_ip:30080 访问
```
若要使用其他地址和端口，请在docker run时加入参数
```bash
docker run --network host -d --privileged --name ntwa nexttraceweb 127.0.0.1:30080
# 监听127.0.0.1:30080
docker run --network host -d --privileged --name ntwa nexttraceweb 80
# 监听所有IP的80端口
docker run --network host -d --privileged --name ntwa nexttraceweb [::1]:30080
# 监听[::1]:30080
```

