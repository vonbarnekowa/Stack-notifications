const manifest = chrome.runtime.getManifest();
const config = {
    id: chrome.runtime.id,
    storage: chrome.storage.local,
    manifest: manifest,
    name: manifest.name,
    iconUrl: "chrome-extension://" + chrome.runtime.id + "/icons/se158.png",
    clientId: encodeURIComponent(manifest.oauth2.client_id),
    scope: encodeURIComponent(manifest.oauth2.scopes.join(",")),
    redirectUri: encodeURIComponent("https://" + chrome.runtime.id + ".chromiumapp.org/provider_cb"),
    loginUrl: "https://stackexchange.com/oauth/dialog",
    key: "9VUiWJXpfMRsOtNEMh3)UQ(("
}

function getToken(callback) {
    config.storage.get("token", function (obj) {
        const token = obj.token;
        callback(token);
    });
}

function setToken(newToken) {
    config.storage.set({"token": newToken});
}

function decodeHTML(uncodedText) {
    var htmlBlock = document.createElement('textarea');
    htmlBlock.innerHTML = uncodedText;
    decodedText = htmlBlock.textContent;
    htmlBlock.remove();

    return decodedText;
}

function showNotif(id, title, message, iconUrl, contextMessage = null) {
    chrome.notifications.create(id, {
        title: title,
        message: message,
        contextMessage: contextMessage,
        type: "basic",
        isClickable: false,
        iconUrl: iconUrl
    }, function (notificationId) {
        chrome.notifications.onClicked.addListener(function (notificationId) {
            chrome.notifications.onClicked.addListener(function (notificationId) {
                var index = getIndexInArray(inboxNotif, notificationId);
                if (index >= 0) {
                    chrome.tabs.create({url: inboxNotif[index].link});
                }
                chrome.notifications.clear(notificationId);
            });
        });
    });
}

function login() {
    var url = config.loginUrl +
        "?client_id=" + config.clientId +
        "&redirect_uri=" + config.redirectUri +
        "&scope=" + config.scope;
    chrome.identity.launchWebAuthFlow({
            "url": url,
            "interactive": true
        },
        function (redirectUrl) {
            if (redirectUrl) {
                var vars = redirectUrl.split("#access_token=");
                setToken(vars[1]);
                showNotif("login-success", config.name, "You've got successfuly logged in.", config.iconUrl);
            } else {
                showNotif("login-error", config.name, "There was an error log you in.", config.iconUrl);
            }
        }
    );
}

function logout(token) {
    if (token) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://api.stackexchange.com/2.2/access-tokens/" + token + "/invalidate", false);
        xhr.send();
        if (xhr.status == 200) {
            config.storage.remove("token", function () {
                showNotif("logout-success", config.name, "You've got successfuly logged out.", config.iconUrl);
            });
        } else {
            showNotif("logout-error", config.name, "There was an error log you out.", config.iconUrl);
        }
    }
}

function getInbox(token) {
    var xhr = new XMLHttpRequest();
    if (token) {
        xhr.open("GET", "https://api.stackexchange.com/2.2/inbox/unread?key=" + config.key + "&access_token=" + token, true);
        xhr.onload = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    notifications = JSON.parse(xhr.responseText).items;
                    for (var notificationId in notifications) {
                        var notification = notifications[notificationId];
                        console.log(getIndexInArray(inboxNotif, notification.creation_date));
                        if (getIndexInArray(inboxNotif, notification.creation_date) == -1) {
                            inboxNotif.push({id: notification.creation_date, link: notification.link});
                            showNotif(notification.creation_date.toString(), decodeHTML(notification.site.name), decodeHTML(notification.title), notification.site.icon_url, notification.item_type);
                        }
                    }
                } else {
                    console.error(xhr.statusText);

                    return;
                }
            }
        };
        xhr.onerror = function (e) {
            console.error(xhr.statusText);

            return;
        };
        xhr.send(null);
    } else {
        console.error("No token in getInbox.");

        return;
    }
}

function getIndexInArray(array, notificationId) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].id === notificationId) {

            return i;
        }
    }

    return -1;
}

function current(token) {
    if (token) {
        chrome.contextMenus.update(
            "1",
            {
                "title": "Stack Exchange log out",
                "onclick": function () {
                    getToken(logout);
                }
            }
        );
        getToken(getInbox);
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
    setTimeout(function () {
        getToken(current);
    }, 5000);
}

function init(token) {
    if (token) {
        chrome.contextMenus.create({
            "id": "1",
            "title": "Stack Exchange log out",
            "type": "normal",
            "contexts": ["all"],
            "onclick": function () {
                getToken(logout);
            }
        });
        getToken(current);
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
        getToken(current);
    }
    chrome.contextMenus.create({
        "id": "report-bug",
        "title": "Report a bug",
        "type": "normal",
        "contexts": ["all"],
        "onclick": function () {
            chrome.tabs.create({url: "https://github.com/fralec/SE-chrome-ext/issues/new"});
        }
    });
}

getToken(init);
var inboxNotif = [];
