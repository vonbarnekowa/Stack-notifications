var clickHandler = function(e) {
    alert('testing testing');
}

chrome.contextMenus.create({
    "title": "Stackoverflow log in",
    type: "normal",
    contexts:["all"]
});

chrome.contextMenus.onClicked.addListener(clickHandler);