function setup() {
    chrome.storage.local.get("token", function (obj) {
        if (obj.token) {
            document.querySelector("button").innerHTML = "Stack Exchange log out";
        } else {
            document.querySelector("button").innerHTML = "Stack Exchange log in";
        }
    });
}

function buttonClick() {
    chrome.storage.local.get("token", function (obj) {
        if (obj.token) {
            chrome.extension.getBackgroundPage().getToken(chrome.extension.getBackgroundPage().logout);
        } else {
            chrome.extension.getBackgroundPage().login();
        }
    });
}

setup();
document.querySelector("button").addEventListener("click", buttonClick, false);
chrome.storage.onChanged.addListener(function(obj, namespace) {
    console.log(obj);
    if (obj.token.newValue) {
        document.querySelector("button").innerHTML = "Stack Exchange log out";
    } else {
        document.querySelector("button").innerHTML = "Stack Exchange log in";
    }
});