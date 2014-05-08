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
var appsAirtime = [];
var createdApps = [];
var appDuration;
var appDurationRemainder;
var hideNotificationTime = 10000;
var giveMeMoreTimeFunc;
var giveMeMoreTimeTimer;
var timerPauseRequest;
var timerPause;
var pausedApps = [];
var options = "options.html";
var startTime;
var pausedTime;
var extraTime;
var extraTimeMiliseconds;
var windowId;
var openedApps = 0;
var numMaxTabs = 10;
var schedulerActiveTab;
var openedTabs = [];
var closeSchedFlag = false;

//flags
var firstRunFlag = true;
var firstCreatedAppFlag = true;
var addShowMeAppFlag = false;
var pausedFlag = false;

//hardcoded schedules
var applications = [
{id: 2, name: "Youtube Video", url: "http://localhost/05_03_simpleAppVideo2/", duration: 30, priority: 3, background: false, showMe: false, paused: false, opr: false},
{id: 0, name: "No lifecycle app", url: "http://localhost/05_03_noLifecycleApp/", duration: 15, priority: 2, background: false, showMe: false, paused: false, opr: false},
{id: 1, name: "Calendar", url: "http://localhost/05_03_simpleAppCalendar/", duration: 20, priority: 1, background: true, showMe: false, paused: false, opr: false},
{id: 3, name: "Simple Bck App", url:"http://localhost/05_03_simpleBackgroundApp/", duration: 10, priority: 1, background: true, showMe: false, paused: false, opr: false},
{id: 4, name: "On demand video", url: "http://ecra.pt/ondemandvideoplay/index-publicdisplay.html", duration: 30, priority: 3, background: true, showMe: false, paused: false, opr: false},
{id: 5, name: "Simple App", url:"http://localhost/05_03_simpleApp/", duration: 20, priority: 1, background: false, showMe: false, paused: false, opr: false},
];

var openOptions = function optionsPage(){
	chrome.tabs.create({ url: options, active: true });
}

var stopScheduler = function stop(){
	firstRunFlag = true;
	closeSchedFlag = true;
	printSimpleMsg("SCHEDULER", "Stoping...","");
	closeScheduler();
}

function addNewApp(name,url,duration,priority,background){
	var newApp = {};

	newApp.id = 5;
	newApp.name = name;
	newApp.url = url;
	newApp.duration = duration;
	newApp.priority = priority;
	newApp.background = background;
	newApp.showMe = false;
	newApp.paused = false;

	applications.push(newApp);
	schedule.splice(schedule.length-1,0,newApp);
	printRedMsg("APPS", "New application added: ",url);
}

function removeApp(appId){
	for(var i = 0; i < schedule.length; i++){
		if(schedule[i].id === appId)
			schedule.splice(i, 1);
	}
}

function updateApp(appId,updatedValues){
	for(var i = 0; i < schedule.length; i++){
		if(schedule[i].id === appId){
			schedule[i].name = updatedValues[0];
			schedule[i].url = updatedValues[1];
			schedule[i].duration = updatedValues[2];
			schedule[i].priority = updatedValues[3];
			schedule[i].background = updatedValues[4];
		}
	}
}

var startScheduler = function starting(){
	printSimpleMsg("SCHEDULER", "Starting...","");

	//window used by scheduler is set to fullscreen
	//chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {state: "fullscreen"});

	//print initial array
	printArray(schedule, "INITIAL SCHEDULE");

	//load all background apps in inactive tabs
	loadBckApps(applications);

	//close all tabs opened in the window before starting the scheduler
	//closeTabs(openedTabs);

	//get 1st application
	var app = schedule[0];
	printSimpleMsg("SCHEDULER", "First application", app.url);

	//start scheduler by opening first app on a background tab
	createApp(app,sendOnCreateMsg);
}

function loadApp(app){
	printSimpleMsg("SCHEDULER", "Loading app", app.url);

	//get next application tab id
	var tabId =  getTabIdFromAppId(tabIdToAppInfo, app.id);

	/////////////////////////////////////////////////////////



	//     if tabId is undefined go to next application    //



	/////////////////////////////////////////////////////////

	//get duration of next app
	appDuration = app.duration;

	//send message onLoad
	printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnLoad, ""]);
   	chrome.tabs.sendMessage(tabId, {state: messageOnLoad, url: app.url});

   	//handles extra time on onPauseRequest callback
	giveMeMoreTimeFunc = function moreTimeFunc(extraTime){
		printSimpleMsg("GIVE ME MORE TIME", "Received message asking for more time: ", extraTime);
		//pause current timeout
		printSimpleMsg("GIVE ME MORE TIME", "Pausing current application...","");
		var paused = timerPause.pause();
		
		//if timer is paused			
		if(paused === 1){
			//resume job after extraTime is elapsed
			giveMeMoreTimeTimer = setTimeout(function(){
				timerPause.resume();
				printSimpleMsg("GIVE ME MORE TIME", "Resuming current application...","");
			},extraTime);
		}
	}
}

function resumeApp(app){
	//when resuming an application, remove it from "pausedApps" array
	removeAppFromPausedArray(app);

	printSimpleMsg("SCHEDULER", "Resuming app", app.url );

	//resume paused application
	var tabId =  getTabIdFromAppId(tabIdToAppInfo, app.id);
	activateBackgroundTab(tabId,app.url);

	var currentApp = schedule[schedule.length-1];
	var currentTabId = getTabIdFromAppId(tabIdToAppInfo,currentApp.id);

	//send onPause to current application 
	printCommunicationMsg("Scheduler", ">> Sending", [currentApp.url, messageOnPause, ""]);
	chrome.tabs.sendMessage(currentTabId, {state: messageOnPause, url: currentApp.url});

	app.paused = false;
	updateSchedule(schedule);
	printArray(schedule, "UPDATED SCHEDULE AFTER RESUMEAPP");

	var airTime = getAppAirtime(appsAirtime,app.id);

	if(schedule[schedule.length-1].opr != false){
		appDurationRemainder = (app.duration * 1000 + schedule[schedule.length-1].opr) - airTime;

		//when apps duration is done
		timerPause = new Timer(function(){
			if(schedule[0].paused === false){
				//start loading next application
				loadApp(schedule[0]);
			}
			else{
				resumeApp(schedule[0]);
			}

		}, appDurationRemainder);
	}
	else{
		appDurationRemainder = (app.duration * 1000) - airTime;

		//when apps duration is almost done (10 seconds before)
		timerPauseRequest = new Timer(function(){

			//create next application
			isTabCreated(schedule[0].url).done(function(data){
				if(data === true){
					printRedMsg("TABS", "This application is already created",schedule[0].url);
				}
				else{
					createApp(schedule[0],sendOnCreateMsg);
				}
			});

			//send onPauseRequest to current application
			printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnPauseRequest, ""]);
			chrome.tabs.sendMessage(tabId, {state: messageOnPauseRequest, url: app.url});

		}, appDurationRemainder - hideNotificationTime);

		//when apps duration is done
		timerPause = new Timer(function(){
			if(schedule[0].paused === false){
				//start loading next application
				loadApp(schedule[0]);
			}
			else{
				resumeApp(schedule[0]);
			}

		}, appDurationRemainder);
	}
}

function main(){
	//get initial schedule with all regular apps
	schedule = initialSchedule(applications);

	//get all tabs opened in window before scheduler starts
	getTabs();

	//everytime a tab is removed, id is removed from hashtable "tabIdToURL"
	chrome.tabs.onRemoved.addListener(function(tabId) {
	    delete tabIdToAppInfo[tabId];
	    //console.log("HASH | Tab " + tabId + " was removed!");
	});
	
	//everytime a tab is activated, set "currentTabId" with active tab id
	chrome.tabs.onActivated.addListener(function(activeInfo) {
	    currentTabId = activeInfo.tabId;
		//console.log("HASH | Tab " + currentTabId + " is the active tab!");
	});

	// Set "currentTabId" with active tab id
	chrome.tabs.onActivated.addListener(function(activeInfo) {
	    schedulerActiveTab = activeInfo.tabId;
	});

	//listen for messages coming from extensionScript.js
	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
		var state = message.state;
		var id = sender.tab.id;
		var url = sender.tab.url;
		var time = timeStamp();

		var currentApp;
		var showMeApp;
		var showMeAppCopy;
		var nextApp;

		if(state === "pauseReady"){
			printCommunicationMsg("Scheduler", "<< Receiving", [url, state, message.time]);
		}
		else{
			printCommunicationMsg("Scheduler", "<< Receiving", [url, state, ""]);
		}

		switch(state){
			case "showMe":
			printRedMsg("SHOW ME", "Show me called by application ", url);

			//get showMe application
			showMeApp = getAppFromTabId(applications,id);
			showMeAppCopy = jQuery.extend({}, showMeApp);
			showMeAppCopy.showMe = true;
			nextApp = schedule[0];

			//get current application
			currentApp = schedule[schedule.length-1];

			//if showMe application is already running or is the next application in the list, ignore...
			if(currentApp.id === showMeApp.id || nextApp.id === showMeApp.id){
				printRedMsg("SCHEDULER", "Ignoring SHOW ME - application is already displaying or is the next in line", currentApp.url);
			}
			else if(checkIfPaused(showMeApp)){
				printRedMsg("SCHEDULER", "Ignoring SHOW ME - application is paused", currentApp.url);
			}
			//othwerwise, add showMe app to schedule
			else{
				//compares priorities of both apps
				var compare = isPriorityBigger(currentApp,showMeAppCopy);
				//console.log("SCHEDULER | Comparing apps: " + compare);

				//if both apps have the same priority
				if(compare === false){
					//current app can finish to run normally and "showMe" app is launched next
					addShowMeApp(showMeAppCopy);

					printArray(schedule, "UPDATED SCHEDULE AFTER ADDING SHOW ME APP!");
				}
				else{
					pausedFlag = true;

					currentApp.paused = true;
					updateSchedulePaused(schedule);
					schedule.push(showMeAppCopy);

					printArray(schedule, "UPDATED SCHEDULE AFTER AN APPLICATION IS INTERRUPED");

					timerPauseRequest.removeTimer();
					timerPause.removeTimer();	
					window.clearTimeout(giveMeMoreTimeTimer);

					loadApp(showMeAppCopy);			
				}
			}

			break;

			//if an applications calls "releaseMe"
			case "releaseMe":
				printRedMsg("RELEASE ME", "Release me called by application ", url);
				//both timers linked to the current application are removed
				timerPauseRequest.removeTimer();
				timerPause.removeTimer();

				//and the next application is called
				loadApp(schedule[0]);
			break;

			case "created":
				openedApps = Object.keys(tabIdToAppInfo).length;

				if(openedApps > numMaxTabs){
					var lastApp = pickLastApp(schedule);
					console.log("APPS | THIS IS THE LAST APPLICATION TO BE EXECUTED: " + lastApp.url + lastApp.id);
					var tabId = getTabIdFromAppId(tabIdToAppInfo, lastApp.id);
					//send message onDestroy to application
					printCommunicationMsg("Scheduler", ">> Sending", [lastApp.url, messageOnDestroy, ""]);
					chrome.tabs.sendMessage(tabId, {state: messageOnDestroy, url: lastApp.url});
				}

				var app = getAppFromTabId(applications,id);
				createdApps.push(app);

				if(firstRunFlag === true){
					if(url === schedule[0].url){
						firstRunFlag = false;
						loadApp(app);
					}
				}

			break;

			case "createdAfterUnload":
				if (closeSchedFlag === true) {
					printCommunicationMsg("Scheduler", ">> Sending", [url, messageOnDestroy, ""]);
					chrome.tabs.sendMessage(id, {state: messageOnDestroy, url: url});
				};
			break;

			case "loaded":
				//activate next application
				activateBackgroundTab(id,url);
				var appId = getAppFromTabId(applications,id);

				//console.log("APPS      | Getting start time of application " + appId.url);
				startTime = getTime();

				addStartTimeToHash(appId.id,startTime);

				//if application was interrupted
				if(pausedFlag === true){
					//current application is also the next application
					currentApp = schedule[0];
				}
				else{
					//otherwise, current application is the last application of the list
					currentApp = schedule[schedule.length-1];
				}

				//get information of previous application
				var currentAppTabId = getTabIdFromAppId(tabIdToAppInfo, currentApp.id);

				//and send messge onPause
				if(typeof currentAppTabId === "undefined"){
					console.log("SCHEDULER | FIRST RUN ");
				}
				else{		

					printCommunicationMsg("Scheduler", "<< Receiving", [url, state,""]);
					printCommunicationMsg("Scheduler", ">> Sending", [currentApp.url, messageOnPause, ""]);
					chrome.tabs.sendMessage(currentAppTabId, {state: messageOnPause, url: currentApp.url});
				}

				//if the application was not interrupted
				if(pausedFlag === false){
					//update schedule
					updateSchedule(schedule);
					printArray(schedule, "UPDATED SCHEDULE");
				}
				else{
					//pausedFlag = false;
				}

				//when apps duration is almost done (10 seconds before)
				timerPauseRequest = new Timer(function(){

					//create next application
					isTabCreated(schedule[0].url).done(function(data){
						if(data === true){
							printRedMsg("TABS", "This application is already created",schedule[0].url);
						}
						else{
							createApp(schedule[0],sendOnCreateMsg);
						}
					});

					//send onPauseRequest to current application
					printCommunicationMsg("Scheduler", ">> Sending", [url, messageOnPauseRequest, ""]);
					chrome.tabs.sendMessage(id, {state: messageOnPauseRequest, url: url});

				}, (appDuration * 1000) - hideNotificationTime);

				//when apps duration is done
				timerPause = new Timer(function(){
					if(schedule[0].paused === false){
						//start loading next application
						loadApp(schedule[0]);
					}
					else{
						resumeApp(schedule[0]);
					}

				}, (appDuration * 1000));

			break;

			case "pauseReady":
				extraTime = 0;

				if(message.time > 0){					
					extraTime = message.time;

					//seconds -> miliseconds
					extraTimeMiliseconds = extraTime * 1000;

					//updating onPauseRequest value with extraTimeMiliseconds
					schedule[schedule.length-1].opr = extraTimeMiliseconds;

					giveMeMoreTimeFunc(extraTimeMiliseconds);
				}
				else if(message.time = 0){
					schedule[schedule.length-1].opr = 0;
				}
			break;

			case "paused":	
				printArray(schedule, "I JUST ARRIVED AT PAUSED!!!!!!!!!!!!!!!!!!!!");

				if(pausedFlag === true){
					console.log("PAUSED FLAG TRUEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
					schedule[schedule.length-1].paused = true;
					pausedFlag = false;

					var app = getAppFromTabId(applications,id);
					pausedApps.push(app);
					//console.log("application is paused therefore it shouldn't be unload yet!!!");
				}
				else{
					//change onPauseRequest flag to false
					schedule[0].opr = false;
					//send onUnload message
					printCommunicationMsg("Scheduler", ">> Sending", [url, messageOnUnload, ""]);
					chrome.tabs.sendMessage(id, {state: messageOnUnload, url: url});
				}
				
			break;

			case "destroyReady":
				chrome.tabs.remove(id);
				//remove app from hashtable
			break;
		}
	});
}

main();