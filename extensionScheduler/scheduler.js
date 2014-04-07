console.log("scheduler.js is running...");

//callback messages
var messageOnCreate = "onCreate";
var messageOnLoad = "onLoad";
var messageOnResume = "onResume";
var messageOnPauseRequest = "onPauseRequest";
var messageOnPause = "onPause";
var messageOnUnload = "onUnload";
var messageOnDestroy = "onDestroy";

var schedule; 
var backgroundApps = [];
var tabIdToAppInfo = {};
var createdApps = [];
var appDuration;
var hideNotificationTime = 10000;
var giveMeMoreTimeFunc;
var timerPauseRequest;
var timerPause;
var pausedApps = [];

//flags
var firstRunFlag = true;
var addShowMeAppFlag = false;

//hardcoded schedules
var applications = [
{id: 0, url: "http://localhost/05_03_simpleAppVideo2/", duration: 30, priority: 3, background: false, showMe: false},
{id: 1, url: "http://localhost/05_03_simpleBackgroundApp2/", duration: 10, priority: 3, background: true, showMe: false},
{id: 2, url: "http://localhost/05_03_simpleAppJoke/", duration: 30, priority: 3, background: false, showMe: false},
{id: 3, url: "http://localhost/05_03_simpleApp/", duration: 30, priority: 3, background: false, showMe: false},
{id: 4, url:"http://localhost/05_03_simpleBackgroundApp/", duration: 10, priority: 3, background: true, showMe: false},
];

var openOptions = function optionsPage(){
	chrome.tabs.create({ url: options, active: true });
}

var stopScheduler = function stop(){

}

function addNewApp(url,duration){

}

var startScheduler = function starting(){
	console.log("SCHEDULER | Starting...");

	//get initial schedule with all regular apps
	schedule = initialSchedule(applications);
	console.log("INITIAL SCHEDULE");
	printArray(schedule);

	//load all background apps in inactive tabs
	loadBckApps(applications);

	//get 1st application
	var app = schedule[0];
	console.log("SCHEDULER | First application: " + app.url);

	//open first app on a background tab
	createApp(app,sendOnCreateMsg);
}

function loadApp(app){
	console.log("SCHEDULER | Loading app " + app.url);

	//get next application tab id
	var tabId =  getTabIdFromAppId(tabIdToAppInfo, app.id);

	/////////////////////////////////////////////////////////



	//     if tabId is undefined go to next application    //



	/////////////////////////////////////////////////////////

	//get duration of next app
	appDuration = app.duration;

	//send message onLoad
	var time = timeStamp();
   	console.log(time + " | MESSAGES Extension | >> Sending message <" + messageOnLoad + "> to extensionScript (" + app.url + " , " + tabId + ")");
   	chrome.tabs.sendMessage(tabId, {state: messageOnLoad, url: app.url});

   	//handles extra time on onPauseRequest callback
	giveMeMoreTimeFunc = function moreTimeFunc(extraTime){
		//var receivedMessage = message.data;
		//var extraTime = receivedMessage.timeField;
		console.log("Received message asking for more time: " + extraTime);
		//pause current timeout
		console.log("Pausing current job...");
		var paused = timerPause.pause();
		
		//if timer is paused			
		if(paused === 1){
			//resume job after extraTime is elapsed
			setTimeout(function(){
				timerPause.resume();
				//removes listener [not working correctly!]
				//console.log("-> Removing listener <-");
				console.log("Resuming job...");
				//window.removeEventListener('message', moreTimeFunc);
			},extraTime);
		}
	}
}

function main(){
	//everytime a tab is removed, id is removed from hashtable "tabIdToURL"
	chrome.tabs.onRemoved.addListener(function(tabId) {
	    delete tabIdToAppInfo[tabId];
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
		var url = sender.tab.url;
		var time = timeStamp();

		if(state === "pauseReady"){
			console.log(time + " | MESSAGES Extension | << Receiving message <" + state + " , " + message.time + "> from extensionScript(" + url + " , " + id + ")");
		}
		else{
			console.log(time + " | MESSAGES Extension | << Receiving message <" + state + "> from extensionScript(" + url + " , " + id + ")");
		}

		switch(state){
			case "showMe":
			console.log("APPS | Application " + url + " called SHOW ME !");
			//get showMe application
			var showMeApp = getAppFromTabId(applications,id);
			var showMeAppCopy = jQuery.extend({}, showMeApp);
			showMeAppCopy.showMe = true;

			//get current application
			var currentApp = schedule[schedule.length-1];

			//if showMe application is already running, ignore...
			if(currentApp.id === showMeApp.id){
				console.log("SCHEDULER | Application " + currentApp.url + " is already showing ! Ignore SHOW ME...");
			}
			//othwerwise, add showMe app to schedule
			else{
				//compares priorities of both apps
				var compare = isPriorityBigger(currentApp,showMeAppCopy);
				console.log("SCHEDULER | Comparing apps: " + compare);

				//if both apps have the same priority
				if(compare === false){
					//current app can finish to run normally and "showMe" app is launched next
					addShowMeApp(showMeAppCopy);

					console.log("PRINTING SCHEDULE AFTER ADDING SHOW ME APP!");
					printArray(schedule);
				}
				else{
					//add current application to pausedApps array
					pausedApps.push(currentApp);

					timerPauseRequest.removeTimer();
					timerPause.removeTimer();	

					loadApp(showMeApp);			
				}
			}

			break;

			//if an applications calls "releaseMe"
			case "releaseMe":
				//both timers linked to the current application are removed
				timerPauseRequest.removeTimer();
				timerPause.removeTimer();

				//and the next application is called
				loadApp(schedule[0]);
			break;

			case "created":

				var app = getAppFromTabId(applications,id);
				console.log("APPS | Adding " + app.url + " to array createdApps !");
				createdApps.push(app);

				if(firstRunFlag === true){
					if(url === schedule[0].url){
						firstRunFlag = false;
						loadApp(app);
					}
				}

			break;

			case "loaded":
				//activate next application
				activateBackgroundTab(id,url);

				//send onPause to current application
				var currentApp = schedule[schedule.length-1];
				console.log("PREVIOUS APPLICATION: " + currentApp.url);
				var currentAppTabId = getTabIdFromAppId(tabIdToAppInfo, currentApp.id);

				if(typeof currentAppTabId === "undefined"){
					console.log("SCHEDULER | FIRST RUN ");
				}
				else{		
					var time = timeStamp();
					console.log(time + " | MESSAGES Extension | >> Sending message <" + messageOnPause + "> to extensionScript (" + currentApp.url + " , " + currentAppTabId + ")");
					chrome.tabs.sendMessage(currentAppTabId, {state: messageOnPause, url: currentApp.url});
				}

				//update schedule
				updateSchedule(schedule);
				var time = timeStamp();
				console.log(time + " | UPDATED SCHEDULE");
				printArray(schedule);

				//when apps duration is almost done (10 seconds before)
				timerPauseRequest = new Timer(function(){

					//create next application
					isTabCreated(schedule[0].url).done(function(data){
						if(data === true){
							console.log("TABS | Tab with url " + schedule[0].url + " is already created!");
						}
						else{
							createApp(schedule[0],sendOnCreateMsg);
						}
					});

					//send onPauseRequest to current application
					var time = timeStamp();
					console.log(time + " | MESSAGES Extension | >> Sending message <" + messageOnPauseRequest + "> to extensionScript (" + url + " , " + id + ")");
					chrome.tabs.sendMessage(id, {state: messageOnPauseRequest, url: url});
				}, (appDuration * 1000) - hideNotificationTime);

				//when apps duration is done
				timerPause = new Timer(function(){
					//start loading next application
					loadApp(schedule[0]);

				}, (appDuration * 1000));

			break;

			case "pauseReady":
				if(message.time > 0){
					console.log("APPS | Application " + url + " needs " + message.time + " seconds more !");
					var extraTime = message.time;
					//seconds -> miliseconds
					var extraTimeMiliseconds = extraTime * 1000;
					giveMeMoreTimeFunc(extraTimeMiliseconds);
				}
			break;

			case "paused":
				var time = timeStamp();
			    console.log(time + " | MESSAGES Extension | >> Sending message <" + messageOnUnload + "> to extensionScript (" + url + " , " + id + ")");
				chrome.tabs.sendMessage(id, {state: messageOnUnload, url: url});
			break;
		}
	});
}

main();