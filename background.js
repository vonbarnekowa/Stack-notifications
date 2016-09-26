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
        function(redirectUrl) {
            if (redirectUrl) {
                var vars = redirectUrl.split("#access_token=");
                var storage = chrome.storage.local;
                var obj = {};
                obj["token"] = vars[1];
                storage.set(obj);
            }
        }
    );
}

function logout(token) {
    if (token) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://api.stackexchange.com/2.2/access-tokens/" + token + "/invalidate", true);
        xhr.send();
        chrome.storage.local.remove("token");
    }
}

function init() {
    chrome.storage.local.get("token", function(token) {
        if (token.token) {
            chrome.contextMenus.create({
                "id": "1",
                "title": "Stack Overflow log out",
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
                "title": "Stack Overflow log in",
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

function current() {
    chrome.notifications.create("1", {title: "titre", message: "message", type: "basic", iconUrl: "chrome-extension://" + chrome.runtime.id + "/icon.png"}, function(id){
        
    });
    chrome.storage.local.get("token", function(token) {
       if(token.token) {
           chrome.contextMenus.update(
               "1",
                {
                    "title": "Stack Overflow log out",
                    "onclick": function() {
                        logout(token);
                    }
                }
           );
       } else {
           chrome.contextMenus.update(
               "1",
               {
                   "title": "Stack Overflow log in",
                   "onclick": function() {
                       login();
                   }
               }
           );
       }
    });
    setTimeout(function() {
        current();
    }, 5000);
}
init();
