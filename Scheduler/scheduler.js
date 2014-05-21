console.log("scheduler.js is running...");

//callback messages
var messageOnCreate = "onCreate";
var messageOnLoad = "onLoad";
var messageOnResume = "onResume";
var messageOnPauseRequest = "onPauseRequest";
var messageOnPause = "onPause";
var messageOnUnload = "onUnload";
var messageOnDestroy = "onDestroy";

var schedule = []; 
var applications = [];
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
var options = "options.html";
var startTime;
var pausedTime;
var extraTime;
var extraTimeMiliseconds;
var windowId;
var openedApps = 0;
var scheduledApps = 0;
var numMaxTabs = 3;
var schedulerActiveTab;
var openedTabs = [];

//flags
var runningFlag = false;
var firstRunFlag = true;
var firstCreatedAppFlag = true;
var addShowMeAppFlag = false;
var pausedFlag = false;
var closeSchedFlag = false;
var undefinedFlag = false;

//timers
var destroyReadyTimer = 30000;
var destroyReadyTimersIds = [];
var unloadTimer = 20000;
var unloadTimersIds = [];

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< SCHEDULER OPTIONS >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

var openOptions = function optionsPage(){
	chrome.tabs.create({ url: options, active: true });
}

var stopScheduler = function stop(){
	runningFlag = false;
	firstRunFlag = true;
	closeSchedFlag = true;
	printSimpleMsg("SCHEDULER", "Stoping...","");
	closeScheduler();
}

var closeScheduler = function close(){
	timerPauseRequest.removeTimer();
	timerPause.removeTimer();
	clearTimeout(giveMeMoreTimeTimer);

	Object.keys(tabIdToAppInfo).forEach(function (key) { 
	    var value = tabIdToAppInfo[key];
	    var appId = value[0];
	    var appUrl = value[1];
	    var tabId = parseInt(key);

	    var paused = checkIfAppIsPaused(parseInt(appId));

	    if(tabId === currentTabId){
			printCommunicationMsg("Scheduler", ">> Sending", [appUrl, messageOnPause, ""]);
			chrome.tabs.sendMessage(tabId, {state: messageOnPause, url: appUrl});	    	
	    }
	    else{

	    	if(paused === true){
	    		sendOnUnloadMsg(tabId, appId, appUrl);
	    	}
	    	else{
	    		sendOnDestroyMsg(tabId, appId, appUrl);
	    	}   	
	    }
	});
}

var startScheduler = function start(){
	printSimpleMsg("SCHEDULER", "Starting...","");

	runningFlag = true;
	firstRunFlag = true;
	closeSchedFlag = false;

	var opt = {
        type: "basic",
        title: "Primary Title",
        message: "Primary message to display",
        iconUrl: "url_to_small_icon"
      }

    if(schedule.length === 0){
		chrome.notifications.create("", 
			{type: "basic", 
			title:"Scheduler ERROR",
			message: "There are no applications scheduled !", 
			iconUrl: "images/warning.png"}, function(notificationId){

			});

		printRedMsg("STORAGE","There are no applications scheduled !","");
		return;
    }

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

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< STATES >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


//given an application and index, creates an inactive tab with the application
function createApp(app,callback){
    chrome.tabs.create({ url: app.url, active: false}, function(tab){
        //get window ID
        if(firstCreatedAppFlag === true){
            windowId = tab.windowId;
            firstCreatedAppFlag = false;
        }

        chrome.tabs.executeScript(tab.id, {file: "extensionScript.js", runAt: "document_end"}, function(array){
            var appInfo = [];

            appInfo.push(app.id);
            appInfo.push(app.url);

            addAppToHash(tab.id,appInfo);

            //send message onCreate to the created tab
            callback(tab.id,app.url);
        });
    });
}

//loads an application sending message onLoad
function loadApp(app){
	printSimpleMsg("SCHEDULER", "Loading app", app.url);

	//get next application tab id
	var tabId =  getTabIdFromAppId(tabIdToAppInfo, app.id);

	/////////////////////////////////////////////////////////



	//     if tabId is undefined load application again    //



	/////////////////////////////////////////////////////////

	//get duration of next app
	appDuration = app.duration;

	//send message onLoad
	printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnLoad, ""]);
	try{
	   	chrome.tabs.sendMessage(tabId, {state: messageOnLoad, url: app.url});
	}
	catch(err){
		console.log(err);
		printRedMsg("TABS", "Creating application again",schedule[0].url);
		undefinedFlag = true;
		createApp(schedule[0], sendOnCreateMsg);
	}
}

function resumeApp(app){

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
			var nextAppTabId  = getTabIdFromAppId(tabIdToAppInfo, schedule[0].id);

			//create next application
			isTabCreated(nextAppTabId).done(function(data){
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

function destroyReady(tabId, appId){

	var timerId = getTimerId("destroyReady", tabId);

	clearTimeout(timerId);

	if(closeSchedFlag === true){
		chrome.tabs.remove(tabId);
	}
	else{

		chrome.tabs.remove(tabId);

		removeAppFrom(appId, "schedule");
		removeAppFrom(appId, "applications");					
	}


	if(schedule.length === 0){
		//remove all timers	
		timerPauseRequest.removeTimer();
		timerPause.removeTimer();	
		window.clearTimeout(giveMeMoreTimeTimer);
	}

	//save application's data
	setDataStorage('appsData');
}

function createdAfterUnload(tabId, appId, tabUrl){
	var timerId = getTimerId("createdAfterUnload", tabId);

	clearTimeout(timerId);

	//var app = getAppFromTabId(applications, id);
	var removeMe = checkRemoveMe(appId);

	if (closeSchedFlag === true || removeMe === true) {
		sendOnDestroyMsg(tabId, appId, tabUrl);
	};

	if(schedule.length === 1){
		//load the only application scheduled
		loadApp(schedule[0]);
	}
}

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< SCHEDULER >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

function scheduler(){

	//get application's data
	getDataStorage('appsData').done(function(data){

		if(data.length === 0){
			printRedMsg("STORAGE","There are no applications scheduled !","");
			return;
		}
		else{
			applications = data;
			
			//get initial schedule with all regular apps
			schedule = initialSchedule(applications);
		}
	});

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
		var app = getAppFromTabId(applications,id);

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
			//showMeApp = getAppFromTabId(applications,id);
			showMeApp = app;
			showMeAppCopy = jQuery.extend({}, showMeApp);
			showMeAppCopy.showMe = true;
			nextApp = schedule[0];

			//get current application
			currentApp = schedule[schedule.length-1];

			//if showMe application is already running or is the next application in the list, ignore...
			if(currentApp.id === showMeApp.id || nextApp.id === showMeApp.id){
				printRedMsg("SCHEDULER", "Ignoring SHOW ME - application is already displaying or is the next in line", currentApp.url);
			}
			else if(checkIfAppIsPaused(showMeApp.id)){
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

				if(schedule.length === 1){
					turnRemoveMeTrue(app.id);
					printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnPause, ""]);
					chrome.tabs.sendMessage(id, {state: messageOnPause, url: app.url});
				}
				else{
					//and the next application is called
					loadApp(schedule[0]);
				}
			break;

			case "created":
				openedApps = Object.keys(tabIdToAppInfo).length;
				scheduledApps = openedApps - backgroundApps.length;

				if(scheduledApps > numMaxTabs){
					var lastApp = pickLastApp(schedule);
					printSimpleMsg("APPS", "This is the last application to be executed", lastApp.url);

					var tabId = getTabIdFromAppId(tabIdToAppInfo, lastApp.id);
					
					//send message onDestroy to application
					sendOnDestroyMsg(tabId, app.id, url);
				}

				createdApps.push(app);

				if(firstRunFlag === true){
					if(app.id === schedule[0].id){
						firstRunFlag = false;
						loadApp(app);
					}
				}

				if(undefinedFlag === true){
					undefinedFlag = false;
					loadApp(app);
				}

			break;

			case "createdAfterUnload":
				createdAfterUnload(id, app.id, url);
			break;

			case "loaded":
				//activate next application
				activateBackgroundTab(id,url);

				startTime = getTime();
				addStartTimeToHash(app.id,startTime);

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
				else if(currentAppTabId === id){
					printRedMsg("SCHEDULER", "There is only one application scheduled !","");
				}
				else{		
					if(schedule.length > 1){
						printCommunicationMsg("Scheduler", ">> Sending", [currentApp.url, messageOnPause, ""]);
						chrome.tabs.sendMessage(currentAppTabId, {state: messageOnPause, url: currentApp.url});
					}
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
					var nextAppTabId  = getTabIdFromAppId(tabIdToAppInfo, schedule[0].id);

					if(schedule.length > 1){
						//create next application
						isTabCreated(nextAppTabId).done(function(data){
							if(data === true){
								printRedMsg("TABS", "This application is already created",schedule[0].url);
							}
							else{
								createApp(schedule[0],sendOnCreateMsg);
							}
						});
					}

					//send onPauseRequest to current application
					printCommunicationMsg("Scheduler", ">> Sending", [url, messageOnPauseRequest, ""]);
					chrome.tabs.sendMessage(id, {state: messageOnPauseRequest, url: url});

				}, (appDuration * 1000) - hideNotificationTime);

				//when apps duration is done
				timerPause = new Timer(function(){
					if(schedule.length > 1){
						if(schedule[0].paused === false){
							//start loading next application
							loadApp(schedule[0]);
						}
						else{
							resumeApp(schedule[0]);
						}
					}
					else{
						//send onUnload to current application
						printCommunicationMsg("Scheduler", ">> Sending", [url, messageOnPause, ""]);
						chrome.tabs.sendMessage(id, {state: messageOnPause, url: url});						
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
				if(pausedFlag === true){
					schedule[schedule.length-1].paused = true;
					pausedFlag = false;
					//printRedMsg("APPS", "Application is paused therefore it shouldn't be unloaded yet", app.url);
				}
				else{
					if(schedule.length > 0){
						//change onPauseRequest flag to false
						schedule[0].opr = false;
					}

					//send onUnload message
					sendOnUnloadMsg(id, app.id, url);
				}
				
			break;

			case "destroyReady":
				destroyReady(id, app.id);

			break;
		}
	});
}

scheduler();