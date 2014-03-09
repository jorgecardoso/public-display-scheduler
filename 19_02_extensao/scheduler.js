console.log("scheduler.js is running...");

var schedules = new Array();
var giveMeMoreTimeFunc;
var sendOnDisplayFunc;
var backgroundPage = "scheduler.html";
var startingIn = 5000;
var hideNotificationTime = 10000;
var firstRun;
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
document.getElementById("buttonStartSequence").addEventListener("click",startSequence);

//hardcoded schedules
var schedulesTest = [["http://paginas.fe.up.pt/~ei08060/20_02_simpleAppJoke",30000], ["http://paginas.fe.up.pt/~ei08060/20_02_simpleAppVideo", 30]];

//couting time on console
var t=setInterval(countingTime,1000);

//starts sequential scheduler
function startSequence(){
	//first time running
	firstRun = true;
	//open all applications on background tabs
	//openAllAppsInBackground(schedulesTest);
	//open the two first applications on background tabs
	openAppsInBackgroundTab(schedulesTest,2);
}

function runAppsSequence(arrayOfApps,tabId){
	var tabIdNextApp;
	//print apps
	for(var w = 0; w < arrayOfApps.length; w++){
		console.log(arrayOfApps[w]);
	}

	if(counterSequence === 1){
		console.log("Opening 2nd app on background tab...");
		open2ndAppInBackground(arrayOfApps);
		//restart anotherCounter
		counterSequence = 0;
	}
	
	//first job of the list
	var nextApp = arrayOfApps[0];

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
	var appDuration = findDurationByUrl(schedulesTest,nextApp[0]);
	
	//send message "onLoad" to next job
	chrome.tabs.sendMessage(tabId, {state: messageOnLoad, url: nextApp[0]});
	console.log("MESSAGES Extension | >> Sending to extensionScript (tab ID: " + tabId + ") | Message: " + messageOnLoad + " + " + nextApp[0]);
	
	//when job duration is almost done (10 seconds before)
	var timeHideNotification = new Timer(function(){
		tabIdNextApp = getTabIdFromUrl(tabIdToURL,arrayOfApps[1][0]);		
		//
		//NEXT STEP: parallel lifecycle - send message onLoad to next application
		//
		
		//send onHideNotification to current application
		console.log("MESSAGES Extension | >> Sending to extensionScript (tab ID: " + tabId + " ) | Message: " + messageOnHideNotification + " + " + nextApp[0]);
		chrome.tabs.sendMessage(tabId, {state: messageOnHideNotification, url: nextApp[0]});
	}, (appDuration * 1000) - hideNotificationTime);
	
	//when job duration is done
	var timer = new Timer(function() {
		//send onHide message
		console.log("MESSAGES Extension | >> Sending to extensionScript (tab ID: " + tabId + " ) | Message: " + messageOnHide + " + " + nextApp[0]);
		chrome.tabs.sendMessage(tabId, {state: messageOnHide, url: nextApp[0]});

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
		runAppsSequence(arrayOfApps,tabIdNextApp);


		//
		//NEXT STEP: parallel lifecycle - send message onDisplay to next app instead of running runAppsSequence
		//
		
	}, appDuration * 1000);
}


function main(){	
	//runs when extension button is clicked - opens main page with options
	chrome.browserAction.onClicked.addListener(function(tab) {
		chrome.tabs.create({ url: backgroundPage });
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
		
		switch(state){
			case "created":
				//if created message comes from the first application and the extension is running for the first time
				if(message.url == schedulesTest[0][0] && firstRun === true){
					firstRun = false;
					console.log("MESSAGES Extension | << Received from extensionScript (tab ID : " + sender.tab.id + ") | Message: " + message.state + " + " + message.url);
					console.log("Start running sequence...");
					//start running sequence of apps
					runAppsSequence(schedulesTest,sender.tab.id);
				}
				else{
					console.log("MESSAGES Extension | << Received from extensionScript (tab ID : " + sender.tab.id + ") | Message: " + message.state + " + " + message.url);
					//
					//add application to array appsReady
					//
				}
				
				break;
				
	    	case "loaded":
	    		//if application is loaded
				console.log("MESSAGES Extension | << Received from extensionScript (tab ID : " + sender.tab.id + ") | Message: " + message.state + " + " + message.url);
	    		
	    		//it becomes the foreground app
	    		console.log("Activating background tab " + message.url);
				activateBackgroundTab(sender.tab.id);

				//send message onDisplay to active tab
	    		console.log("MESSAGES Extension | >> Sending to extensionScript (tab ID: " + sender.tab.id + " ) | Message: " + messageOnDisplay + " + " + message.url);
	   			chrome.tabs.sendMessage(sender.tab.id, {state: messageOnDisplay, url: message.url});
	    		break;
				
		case "displaying":
				console.log("MESSAGES Extension | << Received from extensionScript (tab ID : " + sender.tab.id + ") | Message: " + message.state + " + " + message.url);
	    		console.log("Application " + message.url + " is displaying...");
	    		break;
	    		
	    	case "hideReady":
		    	if(message.time > 0){
					console.log("EXTRA TIME : Application " + message.url + "needs more " + message.time + " seconds !");
					var extraTime = message.time;
					//seconds -> miliseconds
					var extraTimeMiliseconds = extraTime * 1000;
					giveMeMoreTimeFunc(extraTimeMiliseconds);
				}
				break;
			case "not_loaded":
				console.log("Application " + sender.tab.url + " is not visible anymore!");
				break;
		}
	});
}

main();