var settingBtn = document.getElementById("settingBtn");
var settingMenu = document.getElementById("settingMenu");
var saveBtn = document.getElementById("saveBtn");

settingBtn.addEventListener("click", function (event) {
    event.preventDefault(); // 阻止按钮默认的提交行为
    settingMenu.style.display = "block";
});

document.addEventListener("click", function (event) {
    var target = event.target;
    if (!settingMenu.contains(target) && target !== settingBtn) {
        settingMenu.style.display = "none";
    }
});
var intervalTimeRange = document.getElementById("intervalTimeRange");
var intervalTimeInput = document.getElementById("intervalTimeInput");
// 拖动滑块时更新输入框的值
intervalTimeRange.addEventListener("input", function () {
    intervalTimeInput.value = intervalTimeRange.value;
});
// 输入框值变化时更新拖动滑块的值
intervalTimeInput.addEventListener("input", function () {
    intervalTimeRange.value = intervalTimeInput.value;
});
var packetSizeRange = document.getElementById("packetSizeRange");
var packetSizeInput = document.getElementById("packetSizeInput");
// 拖动滑块时更新输入框的值
packetSizeRange.addEventListener("input", function () {
    packetSizeInput.value = packetSizeRange.value;
});
// 输入框值变化时更新拖动滑块的值
packetSizeInput.addEventListener("input", function () {
    packetSizeRange.value = packetSizeInput.value;
});

saveBtn.addEventListener("click", function (event) {
    event.preventDefault(); // 阻止按钮默认的提交行为

    // Save settings to localStorage
    localStorage.setItem("language", document.getElementById("language").value);
    localStorage.setItem("intervalSeconds", document.getElementById("intervalTimeInput").value);
    localStorage.setItem("packetSize", document.getElementById("packetSizeInput").value);
    localStorage.setItem("maxHop", document.getElementById("maxHopInput").value);
    localStorage.setItem("minHop", document.getElementById("minHopInput").value);
    localStorage.setItem("port", document.getElementById("portInput").value);
    localStorage.setItem("device", document.getElementById("devInput").value);
    localStorage.setItem("localResolve", document.getElementById("localResolveCheckbox").checked);

    settingMenu.style.display = "none";
});
document.addEventListener("DOMContentLoaded", function (event) {
    // Check if localResolve is in localStorage
    if (localStorage.getItem("localResolve") === null) {
        // If not, set the default value to true
        localStorage.setItem("localResolve", true);
    }
    // Set the checkbox state based on the localStorage value
    document.getElementById("localResolveCheckbox").checked = JSON.parse(localStorage.getItem("localResolve"));

    // Load settings from localStorage
    if (localStorage.getItem("protocol")) {
        document.getElementById("protocol").value = localStorage.getItem("protocol");
    }
    if (localStorage.getItem("language")) {
        document.getElementById("language").value = localStorage.getItem("language");
    }
    if (localStorage.getItem("intervalSeconds")) {
        var intervalSeconds = localStorage.getItem("intervalSeconds");
        document.getElementById("intervalTimeInput").value = intervalSeconds;
        document.getElementById("intervalTimeRange").value = intervalSeconds;
    }
    if (localStorage.getItem("packetSize")) {
        var packetSize = localStorage.getItem("packetSize");
        document.getElementById("packetSizeInput").value = packetSize;
        document.getElementById("packetSizeRange").value = packetSize;
    }
    if (localStorage.getItem("maxHop")) {
        document.getElementById("maxHopInput").value = localStorage.getItem("maxHop");
    }
    if (localStorage.getItem("minHop")) {
        document.getElementById("minHopInput").value = localStorage.getItem("minHop");
    }
    if (localStorage.getItem("port")) {
        document.getElementById("portInput").value = localStorage.getItem("port");
    }
    if (localStorage.getItem("device")) {
        document.getElementById("devInput").value = localStorage.getItem("device");
    }
    if (localStorage.getItem("localResolve")) {
        document.getElementById("localResolveCheckbox").checked = JSON.parse(localStorage.getItem("localResolve"));
    }
});
