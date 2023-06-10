import json
import logging
import os
import re
import subprocess
import time
from threading import Thread

from flask import Flask, render_template, request
from flask_socketio import SocketIO

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

app = Flask(__name__, static_folder='assets')
app.config['SECRET_KEY'] = 'secret'
socketio = SocketIO(app)
nexttrace_path = '/usr/local/bin/nexttrace'
time_limit = 10

# 存储每个客户端的进程
clients = {}
client_last_active = {}


def check_timeouts():
    while True:
        for sid, last_active in list(client_last_active.items()):
            if time.time() - last_active > time_limit:
                stop_nexttrace_for_sid(sid)
                del client_last_active[sid]
        time.sleep(1)


def stop_nexttrace_for_sid(sid):
    task = clients.get(sid)
    if task and task.process:
        task.process.terminate()
        socketio.emit('nexttrace_complete', room=sid)
        if sid in clients:
            del clients[sid]


Thread(target=check_timeouts, daemon=True).start()


class NextTraceTask:
    def __init__(self, sid, _socketio, params, _nexttrace_path):
        self.sid = sid
        self.socketio = _socketio
        self.params = params
        self.nexttrace_path = _nexttrace_path
        self.process = None

    def run(self):
        fixParam = '--map --raw -q 1 --send-time 1 --ttl-time 40'  # -d disable-geoip
        process_env = os.environ.copy()
        process_env['NEXTTRACE_UNINTERRUPTED'] = '1'

        pattern = re.compile(r'[&;<>\"\'()|\[\]{}$#!%*+=]')
        if pattern.search(self.params):
            self.socketio.emit('nexttrace_output', 'Invalid params', room=self.sid)
            self.socketio.emit('nexttrace_complete', room=self.sid)
            raise ValueError('Invalid params')

        self.process = subprocess.Popen(
            [self.nexttrace_path] + self.params.split() + fixParam.split(),
            stdout=subprocess.PIPE, universal_newlines=True, env=process_env
        )

        for line in iter(self.process.stdout.readline, ''):
            if re.match(r'^\d+\|', line):
                line_split = line.split('|')
                res = line_split[0:5] + [''.join(line_split[5:9])] + line_split[9:10]
                if '||||||' in line:
                    res = line_split[0:1] + ['', '', '', '', '', '']
                res_str = json.dumps(obj=res, ensure_ascii=False)
                logging.debug(f"{res_str}")
                self.socketio.emit('nexttrace_output', res_str, room=self.sid)
                client_last_active[self.sid] = time.time()  # 更新客户端的最后活跃时间

            if self.process.poll() is not None:
                self.socketio.emit('nexttrace_complete', room=self.sid)
                break


@app.route('/')
def index():
    return render_template('index.html'), 200


# 返回在assets文件夹下的roboto-mono-latin.woff2字体文件
@app.route('/font/roboto-mono-latin.woff2')
def font():
    return app.send_static_file('roboto-mono-latin.woff2'), 200


@app.route('/css/m.css')
def css():
    return app.send_static_file('m.css'), 200


@socketio.on('connect')
def handle_connect():
    logging.info(f'Client {request.sid} connected')
    client_last_active[request.sid] = time.time()


@socketio.on('disconnect')
def handle_disconnect():
    logging.info(f'Client {request.sid} disconnected')
    stop_nexttrace_for_sid(request.sid)


@socketio.on('start_nexttrace')
def start_nexttrace(data):
    logging.info(f"Client {request.sid} start nexttrace, params: {data}")
    params = data['ip']
    task = NextTraceTask(request.sid, socketio, params, nexttrace_path)
    clients[request.sid] = task
    # 更新客户端的最后活跃时间
    client_last_active[request.sid] = time.time()
    thread = Thread(target=task.run)
    try:
        thread.start()
    except ValueError:
        logging.warning(f"Invalid params: {params}")


@socketio.on('stop_nexttrace')
def stop_nexttrace():
    stop_nexttrace_for_sid(request.sid)


if __name__ == '__main__':
    socketio.run(app, '127.0.0.1', 35000, allow_unsafe_werkzeug=True)
