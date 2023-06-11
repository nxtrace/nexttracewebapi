var socket = io.connect(location.origin);
var dataMap = {}; // 存储已合并的数据

socket.on('connect', function () {
    console.log('Connected');
});

socket.on('disconnect', function () {
    console.log('Disconnected');
});

socket.on('nexttrace_output', function (data) {
    var outputTable = document.getElementById('output');
    mergeDataAndAddOrUpdateRow(outputTable, data);
});

socket.on('nexttrace_complete', function () {
    console.log('Nexttrace complete');
});

socket.on('nexttrace_options', function (data) {
    console.log('Nexttrace options', data);

    // Show modal and let user choose IP address
    var modal = document.getElementById("ipSelector");
    var span = document.getElementsByClassName("close")[0];

    // Populate IP list
    var ipListDiv = document.getElementById("ip-list");
    ipListDiv.innerHTML = '';
    data.forEach((ipAddress, index) => {
        var ipElement = document.createElement("div");
        ipElement.innerHTML = ipAddress;
        ipElement.onclick = function () {
            var option = index + 1; // store the index in option variable, +1 to make it 1-based
            socket.emit('nexttrace_options_choice', {"choice": option}); // emit the choice
            modal.style.display = "none";
        };
        ipListDiv.appendChild(ipElement);
    });

    // Show modal
    modal.style.display = "block";

    // When user clicks on close, hide the modal
    span.onclick = function () {
        modal.style.display = "none";
    };

    // When user clicks outside of the modal, close it
    modal.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
});

async function startNexttrace() {
    var params = document.getElementById("params").value;
    stopNexttrace()
    // 重置表格
    initTable();
    localStorage.setItem("ipVersion", document.getElementById("ipVersion").value);
    localStorage.setItem("protocol", document.getElementById("protocol").value);
    var extraSettings = getFormattedSettings();

    // 使用 await 来等待 parseDomain 函数的结果
    var ip = await parseDomain(params)
    console.log('要trace的ip/domain:', ip)

    if (ip == null) {
        document.getElementById("params").placeholder = "Invalid input or unresolvable domain";
        console.log('Invalid input or unresolvable domain');
        alert('Invalid input or unresolvable domain')
    } else {
        console.log('begin -> ', 'dst:', ip, 'settingsString:', extraSettings);
        socket.emit('start_nexttrace', {ip: ip, extra: extraSettings});
    }
}


function stopNexttrace() {
    dataMap = {}
    socket.emit('stop_nexttrace');
}

function mergeDataAndAddOrUpdateRow(table, cells) {
    var parsedData = JSON.parse(cells); // 解析接收到的JSON列表
    var hop = parsedData[0];
    var latency = parseFloat(parsedData[3]);
    var latencyLast = latency; // 初始化最新一次的 latency 值

    if (hop in dataMap) {
        // 如果存在相同 hop 的数据，则更新已有行的数据
        var rowToUpdate = dataMap[hop].row;
        // console.log("rowToUpdate:", rowToUpdate);
        var latencyLastCell = rowToUpdate.querySelector('.latency_last');
        var latencyAvgCell = rowToUpdate.querySelector('.latency_avg');
        var sentCell = rowToUpdate.querySelector('.sent');
        var lossPktRateCell = rowToUpdate.querySelector('.lossPktRate');

        var ipCell = rowToUpdate.querySelector('.ip');
        var ipList = ipCell.textContent.split('\n');
        if (/\S/.test(parsedData[1]) && !ipList.includes(parsedData[1])) {
            if (ipCell.textContent !== '') {
                ipCell.textContent += '\n' + parsedData[1];
            } else {
                ipCell.textContent = parsedData[1];
            }
        }

        if (/\S/.test(parsedData[4])) {
            rowToUpdate.querySelector('.asn').textContent = parsedData[4];
        }
        if (/\S/.test(parsedData[5])) {
            rowToUpdate.querySelector('.location').textContent = parsedData[5];
        }
        if (/\S/.test(parsedData[6])) {
            rowToUpdate.querySelector('.domain').textContent = parsedData[6];
        }
        var latencyBestCell = rowToUpdate.querySelector('.latency_best');
        var latencyWorstCell = rowToUpdate.querySelector('.latency_worst');
        var latencyStdCell = rowToUpdate.querySelector('.latency_std');

        var data = dataMap[hop].data;
        if (latency !== 0 && !isNaN(latency)) {
            data.latencyList.push(latency);
            // 更新数据
            data.count++;
            data.latencySum += latency;
            latencyAvg = data.latencySum / data.count;
            latencyLast = latency; // 更新最新一次的 latency 值
            // 更新单元格内容
            latencyLastCell.textContent = latencyLast.toFixed(2);
            latencyAvgCell.textContent = latencyAvg.toFixed(2);
            sentCell.textContent = data.count + data.lossPktSum;
            latencyBestCell.textContent = Math.min.apply(null, data.latencyList).toFixed(2);
            latencyWorstCell.textContent = Math.max.apply(null, data.latencyList).toFixed(2);

            // 添加这些行来设置背景颜色
            var colorForLast = getRGB(latencyLast);
            latencyLastCell.style.backgroundColor = 'rgb(' + colorForLast['r'] + ',' + colorForLast['g'] + ',' + colorForLast['b'] + ')';
            var colorForAvg = getRGB(latencyAvg);
            latencyAvgCell.style.backgroundColor = 'rgb(' + colorForAvg['r'] + ',' + colorForAvg['g'] + ',' + colorForAvg['b'] + ')';
            var colorForBest = getRGB(Math.min.apply(null, data.latencyList));
            latencyBestCell.style.backgroundColor = 'rgb(' + colorForBest['r'] + ',' + colorForBest['g'] + ',' + colorForBest['b'] + ')';
            var colorForWorst = getRGB(Math.max.apply(null, data.latencyList));
            latencyWorstCell.style.backgroundColor = 'rgb(' + colorForWorst['r'] + ',' + colorForWorst['g'] + ',' + colorForWorst['b'] + ')';

            var latencyStd = 0;
            data.latencyList.forEach(function (latency) {
                latencyStd += Math.pow(latency - latencyAvg, 2);
            });
            latencyStd = Math.sqrt(latencyStd / data.count);
            latencyStdCell.textContent = latencyStd.toFixed(2);
            var colorForStd = getRGBstdev(latencyStd);
            latencyStdCell.style.backgroundColor = 'rgb(' + colorForStd['r'] + ',' + colorForStd['g'] + ',' + colorForStd['b'] + ')';

        } else {
            latencyLastCell.textContent = '-'
            data.lossPktSum++;
            lossPktRateCell.textContent = String(Math.round((100 * data.lossPktSum / (data.lossPktSum + data.count)) * 10) / 10);
            lossPktRateCell.style.backgroundColor = getLossColor(100 * data.lossPktSum / (data.lossPktSum + data.count));
        }

        var rdnsCell = rowToUpdate.querySelector('.rdns');
        var rdnsList = rdnsCell.textContent.split('\n');
        if (/\S/.test(parsedData[2]) && !rdnsList.includes(parsedData[2])) {
            if (rdnsCell.textContent !== '') {
                rdnsCell.textContent += '\n' + parsedData[2];
            } else {
                rdnsCell.textContent = parsedData[2];
            }
        }


    } else {
        if (latency !== 0 && !isNaN(latency)) {
            var data = {
                count: 1,
                latencySum: latency,
                lossPktSum: 0,
                latencyList: [latency]
            };
            var latencyAvg = latency;
            dataMap[hop] = {
                data: data,
                row: addDataRow(table, parsedData, latencyLast.toFixed(2), latencyAvg.toFixed(2), 1, 0)
            };
        } else {
            var data = {
                count: 0,
                latencySum: 0,
                lossPktSum: 1,
                latencyList: []
            };
            dataMap[hop] = {
                data: data,
                row: addDataRow(table, parsedData, '-', '-', 0, 1)
            };
        }

    }
    sortTableRows(table);
}

function sortTableRows(table) {
    var tbody = table.getElementsByTagName('tbody')[0];
    var rows = Array.prototype.slice.call(tbody.getElementsByTagName('tr'), 0);

    // 按照第一列（索引为0）的数字大小排序
    rows.sort(function (a, b) {
        var aValue = parseInt(a.cells[0].textContent, 10);
        var bValue = parseInt(b.cells[0].textContent, 10);
        return aValue - bValue;
    });

    // 将排序后的行重新添加到tbody
    rows.forEach(function (row) {
        tbody.appendChild(row);
    });
    hideEmptyRowsAfterLastWithData(tbody)
}

function hideEmptyRowsAfterLastWithData(tbody) {
    var rows = tbody.getElementsByTagName('tr');
    var lastRowWithDataIndex = null;

    // 查找最后一个具有第二列数据的行的索引
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].cells[1].textContent.trim() !== "") {
            lastRowWithDataIndex = i;
        }
    }
    for (var i = lastRowWithDataIndex + 1; i < rows.length; i++) {
        rows[i].style.display = 'none';
    }
}

function addDataRow(table, cells, latencyLast, latencyAvg, count, lossPktSum) {
    // console.log("cells array:", cells);
    var tbody = table.getElementsByTagName('tbody')[0];

    // 创建新行
    var row = document.createElement('tr');

    var classNames = ['hops', 'ip', 'rdns', 'latency', 'asn', 'location', 'domain'];

    cells.forEach(function (cellContent, index) {
        if (index !== 3 && index !== 2) {
            var cell = document.createElement('td');
            cell.textContent = cellContent;
            if (index <= classNames.length) {
                cell.className = classNames[index];
            }
            row.appendChild(cell);
        }
    });

    var lossPktRateCell = document.createElement('td');
    lossPktRateCell.textContent = String(Math.round((100 * lossPktSum / (lossPktSum + count)) * 10) / 10);
    lossPktRateCell.className = 'lossPktRate';
    row.appendChild(lossPktRateCell);

    var sentCell = document.createElement('td');
    sentCell.textContent = count + lossPktSum;
    sentCell.className = 'sent';
    row.appendChild(sentCell);

    var latencyLastCell = document.createElement('td');
    latencyLastCell.textContent = latencyLast;
    latencyLastCell.className = 'latency_last';
    row.appendChild(latencyLastCell);

    var latencyAvgCell = document.createElement('td');
    latencyAvgCell.textContent = latencyAvg;
    latencyAvgCell.className = 'latency_avg';
    row.appendChild(latencyAvgCell);

    var latencyBestCell = document.createElement('td');
    latencyBestCell.textContent = latencyLast;
    latencyBestCell.className = 'latency_best';
    row.appendChild(latencyBestCell);

    var latencyWorstCell = document.createElement('td');
    latencyWorstCell.textContent = latencyLast;
    latencyWorstCell.className = 'latency_worst';
    row.appendChild(latencyWorstCell);

    var latencyStdCell = document.createElement('td');
    latencyStdCell.textContent = '0';
    latencyStdCell.className = 'latency_std';
    row.appendChild(latencyStdCell);

    var rdnsCell = document.createElement('td');
    rdnsCell.textContent = cells[2];
    rdnsCell.className = 'rdns';
    row.appendChild(rdnsCell);

    // 将新行插入到表格最后
    tbody.appendChild(row);
    return row;
}

function handleKeyPress(event) {
    if (event.keyCode === 13) { // 按下回车键的键码是 13
        event.preventDefault(); // 阻止默认的回车键行为
        startNexttrace(); // 调用 startNexttrace() 函数
    }
}

function getRGB ( latency ) {
    var result = [];
    result [ 'r' ] = 0;
    result [ 'g' ] = 0;
    result [ 'b' ] = 0;
    if ( isNaN ( latency ) || latency === 0 ) {
        return result;
    }
    var color_r = Math.round ( ( latency - 180 ) / 2 );
    //var color_r = Math.round ( 0.000001 * Math.pow ( latency - 150, 3.3 ) );
    if ( color_r < 0 ) color_r = 0;
    if ( color_r > 100 ) color_r = 100;

    //var color_g = Math.round ( ( 200 - latency  / 1.2 ) );
    // https://www.desmos.com/calculator
    // y = 55 - 0.0000075 * x^3
    var color_g = Math.round (40 - 0.000005 * Math.pow ( latency, 3 ) );
    if ( color_g < 0 ) color_g = 0;
    if ( color_g > 40 ) color_g = 40;
    var color_b = 0;
    result [ 'r' ] = color_r;
    result [ 'g' ] = color_g;
    result [ 'b' ] = color_b;
    return result;
}

function getRGBstdev ( stdev ) {
    var result = [];
    result [ 'r' ] = 0;
    result [ 'g' ] = 0;
    result [ 'b' ] = 0;
    if ( isNaN ( stdev ) || stdev === 0 ) {
        return result;
    }
    var color_r = Math.round ( ( stdev - 5 ) * 4 )  ;
    if ( color_r < 0 ) color_r = 0;
    if ( color_r > 100 ) color_r = 100;
    var color_g = 0;
    var color_b = 0;
    result [ 'r' ] = color_r;
    result [ 'g' ] = color_g;
    result [ 'b' ] = color_b;
    return result;
}

function getLossColor(loss) {
    var colorLossR = Math.round(Math.pow(loss, 1.6) + 10);
    if (colorLossR < 11) colorLossR = 0;
    if (colorLossR > 160) colorLossR = 160;
    return 'rgba(' + colorLossR + ',0,0,1)';
}

function resetForm() {
    stopNexttrace()
    // 重置输入框
    document.getElementById("params").value = "";
    // 重置表格
    initTable();
}

function initTable() {
    // 清空动态添加的表格行
    var tableBody = document.querySelector("#output tbody");
    tableBody.innerHTML = `
              <th>HOP</th>
              <th>IP</th>
              <th>ASN</th>
              <th>LOCATION</th>
              <th>DOMAIN</th>
              <th>LOSS%</th>
              <th>SENT</th>
              <th>LAST</th>
              <th>AVG</th>
              <th>BEST</th>
              <th>WORST</th>
              <th>STDEV</th>
              <th>PTR</th>
              <!-- 暂时搁置       <th>CHART</th>-->
            `;
}

function getValueFromLocalStorage(key) {
    var _value = localStorage.getItem(key);
    return _value ? _value : null;
}

function getFormattedSettings() {
    var settings = {
        ipVersion: getValueFromLocalStorage("ipVersion"),
        protocol: getValueFromLocalStorage("protocol"),
        language: getValueFromLocalStorage("language"),
        intervalSeconds: getValueFromLocalStorage("intervalSeconds"),
        packetSize: getValueFromLocalStorage("packetSize"),
        maxHop: getValueFromLocalStorage("maxHop"),
        minHop: getValueFromLocalStorage("minHop"),
        port: getValueFromLocalStorage("port"),
        device: getValueFromLocalStorage("device")
    };

    // 将设置对象转换为JSON字符串
    return JSON.stringify(settings);
}

function fetchWithTimeout(url, options, timeout = 3000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('请求超时')), timeout)
        )
    ]);
}

function resolveDomain(domain) {
    return new Promise((resolve, reject) => {
        var ipVersion = getValueFromLocalStorage("ipVersion");
        var types = [];
        // 根据ipVersion决定查询类型
        if (ipVersion === 'ipv6') {
            types = ['AAAA']; // 只查询IPv6
        } else if (ipVersion === 'all') {
            types = ['AAAA', 'A']; // 查询IPv4和IPv6
        } else {
            types = ['A']; // 默认只查询IPv4
        }
        var resolvedAddresses = [];

        function doResolve(dnsUrl) {
            var promises = types.map(function (type) {
                return fetchWithTimeout(dnsUrl + '?name=' + domain + '&type=' + type, {
                    headers: { 'accept': 'application/dns-json' }
                }, 3000) // 设置超时时间为 3 秒
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (data) {
                        if (data && data.Answer && data.Answer.length > 0) {
                            for (var i = 0; i < data.Answer.length; i++) {
                                var ipAddress = data.Answer[i].data;
                                console.log('IP地址:', ipAddress, '类型:', type);
                                resolvedAddresses.push(ipAddress);
                            }
                        } else {
                            console.log('未能解析域名,', 'type:', type, 'domain:', domain);
                        }
                    });
            });

            return Promise.all(promises);
        }

        // 尝试使用 Cloudflare
        doResolve('https://cloudflare-dns.com/dns-query').catch(() => {
            console.log('使用 Cloudflare 失败，尝试使用 doh.sb');
            return doResolve('https://doh.sb/dns-query');
        }).then(() => {
            if (resolvedAddresses.length > 1) {
                // Show modal and let user choose IP address
                var modal = document.getElementById("ipSelector");
                var span = document.getElementsByClassName("close")[0];

                // Populate IP list
                var ipListDiv = document.getElementById("ip-list");
                ipListDiv.innerHTML = '';
                resolvedAddresses.forEach(ipAddress => {
                    var ipElement = document.createElement("div");
                    ipElement.innerHTML = ipAddress;
                    ipElement.onclick = function () {
                        resolve(ipAddress);
                        modal.style.display = "none";
                    };
                    ipListDiv.appendChild(ipElement);
                });

                // Show modal
                modal.style.display = "block";

                // When user clicks on close, hide the modal
                span.onclick = function () {
                    modal.style.display = "none";
                    resolve(null);
                };

                // When user clicks outside of the modal, close it
                window.onclick = function (event) {
                    if (event.target === modal) {
                        modal.style.display = "none";
                        resolve(null);
                    }
                };
            } else {
                // If there is only one IP or none, resolve immediately
                resolve(resolvedAddresses[0] || null);
            }
        }).catch(() => {
            // 在此处显示一个错误消息
            alert('无法解析域名，请检查你与DOH服务器的连接或尝试使用使用SERVER RESOLVE模式.');
            // 弹出确认对话框
            var userChoice = confirm("是否切换为 SERVER RESOLVE 模式？");
            // 根据用户选择执行操作
            if (userChoice) {
                // 用户点击了 “是”
                localStorage.setItem("localResolve", "false");
                document.getElementById("localResolveCheckbox").checked = JSON.parse(localStorage.getItem("localResolve"));
            } else {
                alert('RESOLVE模式您稍后可以在Settings中更改.');
            }
        });
    });
}


function parseDomain(domain) {
    //判断domian 是不是IPv4
    if ((domain.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) || (domain.match(/^[a-fA-F0-9:]+$/))) {
        return domain;
    }
    return new Promise((resolve, reject) => {
        if (!domain || domain === "") {
            console.error("Usage: Please provide a domain/ip/url.");
            resolve(null);
        }

        if (domain.includes("/")) {
            domain = domain.split("/")[2];
        }

        if (domain.includes("]")) {
            domain = domain.split("]")[0].split("[")[1];
        } else if (domain.includes(":")) {
            if ((domain.match(/:/g) || []).length === 1) {
                domain = domain.split(":")[0];
            }
        }

        var localResolve = getValueFromLocalStorage("localResolve");
        if (localResolve === "true") {
            console.log("使用本地DNS解析域名:", domain);
            resolveDomain(domain).then(ipAddress => {
                if (ipAddress) {
                    resolve(ipAddress);
                } else {
                    resolve(null);
                }
            });
        } else {
            console.log("使用服务器解析域名:", domain);
            resolve(domain);
        }
    });
}
