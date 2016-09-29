function run() {
    chrome.storage.local.get("token", function (obj) {
        if (obj.token) {
            document.querySelector("button").innerHTML = "Stack Exchange log out";
        } else {
            document.querySelector("button").innerHTML = "Stack Exchange log in";
        }
    });
    setTimeout(function () {
        run();
    }, 5000);
}

function buttonClick() {
    chrome.storage.local.get("token", function (obj) {
        if (obj.token) {
            chrome.extension.getBackgroundPage().getToken(chrome.extension.getBackgroundPage().logout);
            document.querySelector("button").innerHTML = "Stack Exchange log in";
        } else {
            chrome.extension.getBackgroundPage().login();
            document.querySelector("button").innerHTML = "Stack Exchange log out";
        }
    });
}

run();
document.querySelector("button").addEventListener("click", buttonClick, false);
