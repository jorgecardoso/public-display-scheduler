console.log("popup.js is running...");

var backgroundPage = chrome.extension.getBackgroundPage();

var start = backgroundPage.startScheduler;

document.getElementById("buttonStart").addEventListener("click",start);

var stop = backgroundPage.stopScheduler;

document.getElementById("buttonStop").addEventListener("click",stop);

var options = backgroundPage.openOptions;

document.getElementById("buttonOptions").addEventListener("click",options);
