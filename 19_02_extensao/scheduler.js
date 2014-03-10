console.log("scheduler.js is running...");

var schedules = new Array();
var giveMeMoreTimeFunc;
var sendOnDisplayFunc;
var backgroundPage = "scheduler.html";
var startingIn = 5000;
var hideNotificationTime = 10000;
var firstRun = true;
var firstTabDisplaying = true;
var tabIdToURL = {};
var currentTabId = -1;
var counter = 0;
var counterSequence = 0;

//messages (communication between extension - extensionScript - appScript)
var messageOnCreate = "onCreate";
var messageOnLoad = "onLoad";
var messageOnHideNotification = "onHideNotification";
var messageOnDisplay = "onDisplay";
var messageOnHide = "onHide";

//add handlers to buttons
document.getElementById("buttonStartSequence").addEventListener("click",runAppsSequence);

//hardcoded schedules
var schedulesTest = [["http://localhost/27_02_simpleApp/", 30]];

//couting time on console
var t=setInterval(countingTime,1000);

function runAppsSequence(arrayOfApps){
	//get next app URL
	var appUrl = schedulesTest[0][0];
	console.log("APPS | Next app: " + appUrl);

	//get duration of next app
	var appDuration = findDurationByUrl(schedulesTest,appUrl);

	//open next app on a background tab
	openAppInBackgroundTab(appUrl);
}

function displayingApp(url){
	var tabId = getTabIdFromUrl(tabIdToURL,url);
	activateBackgroundTab(tabId);

	//gives extra time to apps if requested and approved 
	giveMeMoreTimeFunc = function moreTimeFunc(extraTime){
		console.log("Received message asking for more time: " + extraTime);
		
		//pause current timeout
		console.log("Pausing current job...");
		var paused = timer.pause();
		
		//if timer is paused			
		if(paused === 1){
			//resume job after extraTime is elapsed
			setTimeout(function(){
				timer.resume();
				console.log("Resuming job...");
				window.removeEventListener('message', moreTimeFunc);
			},extraTime);
		}
	}

	//get duration of next app
	var appDuration = findDurationByUrl(schedulesTest,url);

	//when job duration is almost done (10 seconds before)
	var timeHideNotification = new Timer(function(){
		//tabIdNextApp = getTabIdFromUrl(tabIdToURL,arrayOfApps[1][0]);		
		//
		//NEXT STEP: parallel lifecycle - send message onLoad to next application
		//
		
		//send onHideNotification to current application
		//logMessageSending("Extention","extensionScript",tabId,messageOnHideNotification);
		console.log("sending message onhidenoti from extention to extensionScript...");
		chrome.tabs.sendMessage(tabId, {state: messageOnHideNotification, url: url});
	}, (appDuration * 1000) - hideNotificationTime);
	
	//when job duration is done
	var timer = new Timer(function() {
				console.log("sending message onhidenoti from extention to extensionScript...");

		//send onHide message
		chrome.tabs.sendMessage(tabId, {state: messageOnHide, url: url});

		//get 1st job of the list
		var firstJob = arrayOfApps[0];
		//removes it
		arrayOfApps.shift();
		//and push it to the end of the array of jobs
		arrayOfApps.push(firstJob);
		//removes tab
		chrome.tabs.remove(tabId);
		//increase help counter
		counterSequence++;
		//re-runs updated arrayOfJobs
		//runAppsSequence(arrayOfApps,tabIdNextApp);

		//
		//NEXT STEP: parallel lifecycle - send message onDisplay to next app instead of running runAppsSequence
		//
		
	}, appDuration * 1000);
}

function main(){	
    //runs when extension button is clicked - opens main page with options
    chrome.browserAction.onClicked.addListener(function(tab) {
		chrome.tabs.create({url: chrome.extension.getURL('scheduler.html')});        
    });
	
	//everytime a tab is created, id is stored in hashtable "tabIdToURL"
	chrome.tabs.onCreated.addListener(function(tab){
		tabIdToURL[tab.id] = tab.url; // also available as tab.id and changeInfo.url
	   	console.log("HASH | Tab " + tab.url + " with ID " + tab.id + " added!");
	});
	
	//everytime a tab is removed, id is removed from hashtable "tabIdToURL"
	chrome.tabs.onRemoved.addListener(function(tabId) {
	    delete tabIdToURL[tabId];
	    console.log("HASH | Tab " + tabId + " was removed!");
	});
	
	//everytime a tab is activated, set "currentTabId" with active tab id
	chrome.tabs.onActivated.addListener(function(activeInfo) {
	    currentTabId = activeInfo.tabId;
		console.log("HASH | Tab " + currentTabId + " is the active tab!");
	});

	//listen for messages coming from extensionScript.js
	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
		
		var state = message.state;
		var id = sender.tab.id;
		var time = timeStamp();
		var url = sender.tab.url;
		console.log(time + " | MESSAGES Extension | << Receiving message <" + state + "> from extensionScript");
		
		switch(state){
			case "created":
			var time = timeStamp();
            console.log(time + " | MESSAGES Extension | << Receiving message <" + state + "> from extensionScript");
	       	//send message onLoad
	       	//var time = timeStamp();
	       	console.log(time + " | MESSAGES Extension | >> Sending message <" + messageOnLoad + "> to extensionScript");
		   	chrome.tabs.sendMessage(id, {state: messageOnLoad});		
           break;

           case "loaded":
           		displayingApp(url);
           break;
		}
	});
}

main();


