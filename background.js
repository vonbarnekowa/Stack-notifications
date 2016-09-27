const KEY = "9VUiWJXpfMRsOtNEMh3)UQ((";
function login() {
    var manifest = chrome.runtime.getManifest();
    var clientId = encodeURIComponent(manifest.oauth2.client_id);
    var scopes = encodeURIComponent(manifest.oauth2.scopes.join(','));
    var redirectUri = encodeURIComponent("https://" + chrome.runtime.id + ".chromiumapp.org/provider_cb");
    var url = "https://stackexchange.com/oauth/dialog" +
        "?client_id=" + clientId +
        "&redirect_uri=" + redirectUri +
        "&scope=" + scopes;

    chrome.identity.launchWebAuthFlow({
            "url": url,
            "interactive": true
        },
        function (redirectUrl) {
            if (redirectUrl) {
                var vars = redirectUrl.split("#access_token=");
                var storage = chrome.storage.local;
                var obj = {};
                obj["token"] = vars[1];
                storage.set(obj);
                chrome.notifications.create("login-success", {
                    title: "Stack notifications",
                    message: "You've got successfuly logged in.",
                    type: "basic",
                    iconUrl: "chrome-extension://" + chrome.runtime.id + "/icons/se158.png"
                }, function () {
                });
                return;
            } else {
                chrome.notifications.create("login-error", {
                    title: "Stack notifications",
                    message: "There was an error log you in.",
                    type: "basic",
                    iconUrl: "chrome-extension://" + chrome.runtime.id + "/icons/se158.png"
                }, function () {
                });
            }
        }
    );
}

function logout(token) {
    if (token.token) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://api.stackexchange.com/2.2/access-tokens/" + token + "/invalidate", false);
        xhr.send();
        if (xhr.status == 200) {
            chrome.storage.local.remove("token")
            chrome.notifications.create("login-success", {
                title: "Stack notifications",
                message: "You've got successfuly logged out.",
                type: "basic",
                iconUrl: "chrome-extension://" + chrome.runtime.id + "/icons/se158.png"
            }, function () {
            });
        } else {
            chrome.notifications.create("logout-error", {
                title: "Stack notifications",
                message: "There was an error log you out.",
                type: "basic",
                iconUrl: "chrome-extension://" + chrome.runtime.id + "/icons/se158.png"
            }, function () {
            });
        }
    }
}

function init() {
    chrome.storage.local.get("token", function (token) {
        if (token.token) {
            chrome.contextMenus.create({
                "id": "1",
                "title": "Stack Exchange log out",
                "type": "normal",
                "contexts": ["all"],
                "onclick": function () {
                    logout(token);
                }
            });
            current();
        } else {
            chrome.contextMenus.create({
                "id": "1",
                "title": "Stack Exchange log in",
                "type": "normal",
                "contexts": ["all"],
                "onclick": function () {
                    login();
                }
            });
            login();
            current();
        }
    });
}

function getInbox(token) {
    var xhr = new XMLHttpRequest();
    if (token) {
        xhr.open("GET", "https://api.stackexchange.com/2.2/inbox/unread?key=" + KEY + "&access_token=" + token.token, true);
        xhr.onload = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    notifications = JSON.parse(xhr.responseText).items;
                    for (var notificationId in notifications) {
                        var notification = notifications[notificationId];
                        if(showedNotifId.indexOf(notification.link) < 0) {
                            chrome.notifications.create(notification.link, {
                                title: decodeHTML(notification.site.name),
                                message: decodeHTML(notification.title),
                                contextMessage: notification.item_type,
                                type: "basic",
                                iconUrl: notification.site.icon_url,
                                isClickable: true
                            }, function (id) {
                                showedNotifId.push(id);
                                chrome.notifications.onClicked.addListener(function (url) {
                                    chrome.tabs.create({url: url});
                                    chrome.notifications.clear(id);
                                });
                            });
                        }
                    }
                } else {
                    console.error(xhr.statusText);
                }
            }
        };
        xhr.onerror = function (e) {
            console.error(xhr.statusText);
        };
        xhr.send(null);
    } else {
        console.error("No token in getInbox.");
    }
}

function current() {
    /*chrome.notifications.create("1", {title: "Stack notifications", message: "message", type: "basic", iconUrl: "chrome-extension://" + chrome.runtime.id + "/icons/se158.png"}, function(id){

     });*/
    chrome.storage.local.get("token", function (token) {
        if (token.token) {
            getInbox(token);
            chrome.contextMenus.update(
                "1",
                {
                    "title": "Stack Exchange log out",
                    "onclick": function () {
                        logout(token);
                    }
                }
            );
        } else {
            chrome.contextMenus.update(
                "1",
                {
                    "title": "Stack Exchange log in",
                    "onclick": function () {
                        login();
                    }
                }
            );
        }
    });
    setTimeout(function () {
        current();
    }, 5000);
}

function decodeHTML(text) {
    var htmlBlock = document.createElement('textarea');
    htmlBlock.innerHTML = text;
    test = htmlBlock.textContent;
    htmlBlock.remove();
    
    return test;
}

init();
var showedNotifId = new Array();