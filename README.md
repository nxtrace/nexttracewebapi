<div align="center">

<img src="https://github.com/sjlleo/nexttrace/raw/main/asset/logo.png" height="200px" alt="NextTrace Logo"/>

</div>

# NEXTTRACE WEB API

NEXTTRACE项目派生的仓库，用于实现简易的NEXTTRACE WEB API服务端

<img width="1436" alt="截屏2023-06-11 05 06 35" src="https://github.com/tsosunchia/nexttracewebapi/assets/59512455/a2a4cbdd-5e0c-401a-ac02-bbccf463c013">
<img width="352" alt="截屏2023-06-11 05 05 16" src="https://github.com/tsosunchia/nexttracewebapi/assets/59512455/f36924d1-37f8-4eca-bb6c-41800283c628">

请注意，本项目使用了websocket作为通信协议，因此请在配置反代时参考仓库内的代码(本仓库提供的Docker Image 已内置 Nginx 反代)。

Inspired by PING.PE

感谢PING.PE这么多年来的坚持，让我们能够在这个时候有一个这么好的项目可以参考

## How To Use

推荐使用Docker安装
```bash
docker pull tsosc/nexttraceweb
docker run --network host -d --privileged --name ntwa tsosc/nexttraceweb
# 使用 http://your_ip:30080 访问
```
若要使用其他地址和端口，请在docker run时加入参数
```bash
docker run --network host -d --privileged --name ntwa tsosc/nexttraceweb 127.0.0.1:30080
# 监听127.0.0.1:30080
docker run --network host -d --privileged --name ntwa tsosc/nexttraceweb 80
# 监听所有IP的80端口
docker run --network host -d --privileged --name ntwa tsosc/nexttraceweb [::1]:30080
# 监听[::1]:30080
```

