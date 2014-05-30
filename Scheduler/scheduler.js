console.log("scheduler.js is running...");

//callback messages
var messageOnCreate = "onCreate";
var messageOnLoad = "onLoad";
var messageOnResume = "onResume";
var messageOnPauseRequest = "onPauseRequest";
var messageOnPause = "onPause";
var messageOnUnload = "onUnload";
var messageOnDestroy = "onDestroy";

//scheduler data structures
var schedule = []; 
var applications = [];
var backgroundApps = [];
var tabIdToAppInfo = {};
var applicationsAirtimes = {};
var appsStartime = {};
var appsAirtime = [];
var createdApps = [];
var openedTabs = [];
var appAirtime = [];

//application extra time handler
var giveMeMoreTimeFunc;
var giveMeMoreTimeTimer;
var extraTime;
var extraTimeMiliseconds;

//flags
var runningFlag = false;
var firstRunFlag = true;
var firstCreatedAppFlag = true;
var addShowMeAppFlag = false;
var pausedFlag = false;
var closeSchedFlag = false;
var undefinedFlag = false;
var previousAppNotLoaded = false;
var delayedHelpFlag = false;

//timers
var timerPauseRequest;
var timerPause;
var destroyReadyTimer = 30000;
var destroyReadyTimersIds = [];
var unloadTimer = 20000;
var unloadTimersIds = [];
var loadTimer = 10000;
var loadTimersIds = [];

var activeTabId = 0;
var previousActiveTabId = 0;
var appDuration;
var appDurationRemainder;
var hideNotificationTime = 10000;
var options = "options.html";
var startTime;
var pausedTime;
var windowId;
var openedApps = 0;
var scheduledApps = 0;
var numMaxTabs = 3;
var schedulerActiveTab;
var previousReleaseMeId;
var previousLoadedId;
var waitingForLoaded = [];
var delayedLoadedApps = [];

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
	if(timerPauseRequest != undefined)
		timerPauseRequest.removeTimer();
	
	if(timerPause != undefined)
		timerPause.removeTimer();

	window.clearTimeout(giveMeMoreTimeTimer);

	Object.keys(tabIdToAppInfo).forEach(function (key) { 
	    var value = tabIdToAppInfo[key];
	    var appId = value[0];
	    var appUrl = value[1];
	    var tabId = parseInt(key);

	    var paused = checkIfAppIsPaused(parseInt(appId));

	    if(tabId === activeTabId){
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

	//restart opr value of all applications
	restartOpr(applications);

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

	var msgSuccess = 1;

	var waitingLoaded = isAppWaitingLoaded(app.id);
	console.log("is app WAITING for LOADED ?? " + waitingLoaded);

	if(waitingLoaded === true){
		updateSchedule(schedule);
		printArray(schedule,"PRINTING SCHEDULE WAITING APPLICATION TRYING AGAIN !! ! ! !");
		loadApp(schedule[0]);
		return;
	}
	else{
		if(delayedHelpFlag === true){
			delayedHelpFlag = false;
		}
		else{
			if(app.id === previousLoadedId){
				//updateSchedule(schedule);
				printArray(schedule, "Application that is running is the next application to run !");
				delayedHelpFlag = true;

				var tabId = getTabIdFromAppId(tabIdToAppInfo, app.id);
				printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnPause, ""]);
				chrome.tabs.sendMessage(tabId, {state: messageOnPause, url: app.url});
				return;
			}
		}
	}

	var blocked = blockedScheduler();
	
	if(blocked){
		closeSchedFlag = true;
		console.log("I'M BLOCKED !");
		closeScheduler();
		return;
	}

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
		msgSuccess = 0;
		console.log(err);
		printRedMsg("TABS", "Creating application again",schedule[0].url);
		undefinedFlag = true;
		createApp(schedule[0], sendOnCreateMsg);
	}

	if(msgSuccess === 1){	
		var loadInfo = [];

		var loadTimerId = setTimeout( function(){
			printRedMsg("COMMUNICATION Scheduler", "No message loaded received after onLoad sent by", app.url);
			console.warn("No loaded(); used in onLoad of %s", app.url);
			
			previousAppNotLoaded = app.id;
			waitingForLoaded.push(app.id);
			updateSchedule(schedule);

			printArray(schedule,"BEFORE SKIPING APPLICATION !!!!!!!!!!!!!!!!!!!!!!!!!!!!");
			loadApp(schedule[0]);

		}, loadTimer);

		loadInfo.push(tabId);
		loadInfo.push(loadTimerId);

		loadTimersIds.push(loadInfo);
	}
}

function resumeApp(app){

	var resumeStartTime = getTime();
	printSimpleMsg("SCHEDULER", "Resuming app", app.url );

	//resume paused application
	var tabId =  getTabIdFromAppId(tabIdToAppInfo, app.id);
	activateBackgroundTab(tabId,app.url);

	var regularApps = countingRegularApps(applications);

	///////////////////////////////////////////////////////////////////
	//                                                               //
	//   When there is MORE than one regular application scheduled   //
	//                                                               //
	///////////////////////////////////////////////////////////////////

	if(regularApps > 1){
		if(previousLoadedId != app.id){
			console.log("<<<< <   < < <  < < < < <<<<<<<<<<<<< LAST APPLICATION LOADED IS DIFFERENT FROM THIS ONE!");
			var currentApp = schedule[schedule.length-1];
			var currentTabId = getTabIdFromAppId(tabIdToAppInfo,currentApp.id);

			//send onPause to current application 
			printCommunicationMsg("Scheduler", ">> Sending", [currentApp.url, messageOnPause, ""]);
			chrome.tabs.sendMessage(currentTabId, {state: messageOnPause, url: currentApp.url});
		}
	}

	app.paused = false;
	updateSchedule(schedule);
	printArray(schedule, "UPDATED SCHEDULE AFTER RESUMEAPP");

	var airTime = getAppAirtime(tabId);

	if(schedule[schedule.length-1].opr != false){

		appDurationRemainder = (app.duration * 1000 + schedule[schedule.length-1].opr * 1000) - airTime;
		console.log("APp duration remainder: " + appDurationRemainder);

		//when apps duration is done
		timerPause = new Timer(function(){
			if(schedule.length === 1){
				//send onPause to current application 
				printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnPause, ""]);
				chrome.tabs.sendMessage(tabId, {state: messageOnPause, url: app.url});				
			}
			else{
				if(schedule[0].paused === false){
					if(delayedLoadedApps.length > 0){
						var delayedAppId = delayedLoadedApps.shift();
						console.log("DELAYED APP ID");
						var delayedApp = getAppFromAppId(applications, delayedAppId);
						console.log("DELAYED APPLICATION: " + delayedApp.url);

						updateDelayed(schedule, delayedAppId);
						resumeApp(delayedApp);
					}
					else{
						//start loading next application
						console.log("LINHA 301!");
						loadApp(schedule[0]);
					}
				}
				else{
					resumeApp(schedule[0]);				
				}
			}
		}, appDurationRemainder);
	}
	else{
		console.log("AIRTIME: " + airTime);
		appDurationRemainder = (app.duration * 1000) - airTime;
		console.log("APP REMAINDER: " + appDurationRemainder);

		//when apps duration is almost done (10 seconds before)
		timerPauseRequest = new Timer(function(){
			if(schedule.length > 1){
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
			}

			//send onPauseRequest to current application
			printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnPauseRequest, ""]);
			chrome.tabs.sendMessage(tabId, {state: messageOnPauseRequest, url: app.url});

		}, appDurationRemainder - hideNotificationTime);

		//when apps duration is done
		timerPause = new Timer(function(){
			if(schedule.length === 1){
				//send onPause to current application 
				printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnPause, ""]);
				chrome.tabs.sendMessage(tabId, {state: messageOnPause, url: app.url});				
			}
			else{
				if(schedule[0].paused === false){
					if(delayedLoadedApps.length > 0){
						var delayedAppId = delayedLoadedApps.shift();
						console.log("DELAYED APP ID");
						var delayedApp = getAppFromAppId(applications, delayedAppId);
						console.log("DELAYED APPLICATION: " + delayedApp.url);

						updateDelayed(schedule, delayedAppId);
						resumeApp(delayedApp);
					}
					else{
						//start loading next application
						console.log("LINHA 301!");
						loadApp(schedule[0]);
					}
				}
				else{
					resumeApp(schedule[0]);				
				}
			}
		}, appDurationRemainder);
	}
}

function destroyReady(tabId, appId){

	var timerId = getTimerId("destroyReady", tabId);

	clearTimeout(timerId);

	console.log("Clearing airtimes 391!");
	//clear airtime values
	var clearAirtimes =	applicationsAirtimes[tabId];
	if(clearAirtimes != undefined){
		clearAirtimes.length = 0;
		applicationsAirtimes[tabId] = clearAirtimes;
	}

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

		if(timerPauseRequest != undefined)
			timerPauseRequest.removeTimer();

		if(timerPause != undefined)
			timerPause.removeTimer();

		window.clearTimeout(giveMeMoreTimeTimer);
	}

	//save application's data
	setDataStorage('appsData');
}

function createdAfterUnload(tabId, appId, tabUrl){
	var timerId = getTimerId("createdAfterUnload", tabId);
	clearTimeout(timerId);

	//clear airtime values
	var clearAirtimes =	applicationsAirtimes[tabId];
	if(clearAirtimes != undefined){
		clearAirtimes.length = 0;
		applicationsAirtimes[tabId] = clearAirtimes;
	}

	//clear previousReleaseMeId
	if(previousReleaseMeId === appId){
		previousReleaseMeId = undefined;
	}

	//var app = getAppFromTabId(applications, id);
	var removeMe = checkRemoveMe(appId);

	if (closeSchedFlag === true || removeMe === true) {
		sendOnDestroyMsg(tabId, appId, tabUrl);
	};

	if((schedule.length === 1 && closeSchedFlag === false) || delayedHelpFlag === true){

		//load the only application scheduled
		console.log("LINHA 398!");
		console.log(schedule[0].url);
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
		previousActiveTabId = activeTabId;
	    activeTabId = activeInfo.tabId;

	    var startTime = getTime();
	    addStartTimeToHash(activeTabId, startTime);
	    addAppAirtime(startTime, activeTabId, previousActiveTabId);
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
						
						timerPauseRequest.removeTimer();
						timerPause.removeTimer();	
						window.clearTimeout(giveMeMoreTimeTimer);

						pausedFlag = true;

						currentApp.paused = true;

						updateSchedulePaused(schedule);
						schedule.push(showMeAppCopy);

						printArray(schedule, "UPDATED SCHEDULE AFTER AN APPLICATION IS INTERRUPED");

					console.log("LINHA 517 SHOW ME!");

						loadApp(showMeAppCopy);	
					}
				}

			break;

			//if an applications calls "releaseMe"
			case "releaseMe":

				if(previousReleaseMeId === app.id){
					printRedMsg("RELEASE ME","Ignore releaseMe: called twice by application", url);
				}
				else{
					previousReleaseMeId = app.id;
					printRedMsg("RELEASE ME", "Release me called by application ", url);
					//both timers linked to the current application are removed
					timerPauseRequest.removeTimer();
					timerPause.removeTimer();
					clearTimeout(giveMeMoreTimeTimer);

					if(schedule.length === 1){
						turnRemoveMeTrue(app.id);
						printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnPause, ""]);
						chrome.tabs.sendMessage(id, {state: messageOnPause, url: app.url});
					}
					else{
						if(schedule[0].paused === true){
							resumeApp(schedule[0]);
						}
						else{
							//and the next application is called
							console.log("LINHA 550!");
							if(delayedLoadedApps.length > 0){
								var delayedAppId = delayedLoadedApps.shift();
								console.log("DELAYED APP ID");
								var delayedApp = getAppFromAppId(applications, delayedAppId);
								console.log("DELAYED APPLICATION: " + delayedApp.url);

								updateDelayed(schedule, delayedAppId);
								resumeApp(delayedApp);
							}
							else{
								//start loading next application
								console.log("LINHA 301!");
								loadApp(schedule[0]);
							}
						}
					}				
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
											console.log("LINHA 578 FIRST RUN!");

						loadApp(app);
					}
				}

				if(undefinedFlag === true){
					undefinedFlag = false;
					console.log("LINHA 586!");
					loadApp(app);
				}

			break;

			case "createdAfterUnload":
				createdAfterUnload(id, app.id, url);
			break;

			case "loaded":
				var waiting = isAppWaitingLoaded(app.id);
				console.log(waiting);

				//if application loaded() arrived after loaded predefined timer
				if(waiting === true){
					//change loaded flag to true
					//changeLoadedToTrue(app.id);
					printRedMsg("APPLICATIONS", "Application is now loaded and ready to be displayed:",app.url);
					delayedLoadedApps.push(app.id);
					removeWaitingLoadedApp(app.id);
				}
				else{
					console.log("<<<<<<<<<<<<<<<<<< previous loaded ID " + previousLoadedId);
					var waitingAux = previousLoadedId;

					var timerId = getTimerId("loaded", id);
					clearTimeout(timerId);

					//activate next application
					activateBackgroundTab(id,url);

					//if application was interrupted
					if(pausedFlag === true){
						//current application is also the next application
						currentApp = schedule[0];
					}
					else if(previousAppNotLoaded != false){
						currentApp = schedule[1];
						previousAppNotLoaded = false;
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
					else if(waitingAux === undefined){
						printRedMsg("SCHEDULER","There isn't any previously loaded application","");
					}
					else{		
						console.log("loaded else......");
						if(schedule.length > 1){
							if(app.id != waitingAux){
								console.log("sending from here !");
								var app = getAppFromAppId(applications, waitingAux);
								var tabId = getTabIdFromAppId(tabIdToAppInfo, waitingAux);
								printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnPause, ""]);
								chrome.tabs.sendMessage(tabId, {state: messageOnPause, url: app.url});
							}
							else{
								if(app.id === waitingAux){
									console.log("DOING NOTHING !");
								}else{
									printCommunicationMsg("Scheduler", ">> Sending", [currentApp.url, messageOnPause, ""]);
									chrome.tabs.sendMessage(currentAppTabId, {state: messageOnPause, url: currentApp.url});
								}
							}
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
								if(delayedLoadedApps.length > 0){
									var delayedAppId = delayedLoadedApps.shift();
									console.log("DELAYED APP ID");
									var delayedApp = getAppFromAppId(applications, delayedAppId);
									console.log("DELAYED APPLICATION: " + delayedApp.url);

									updateDelayed(schedule, delayedAppId);
									resumeApp(delayedApp);
								}
								else{
									//start loading next application
									console.log("LINHA 301!");
									loadApp(schedule[0]);
								}
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
				}

			break;

			case "pauseReady":
				extraTime = 0;

				if(message.time > 0){					
					extraTime = message.time;

					//seconds -> miliseconds
					extraTimeMiliseconds = extraTime * 1000;

					printArray(schedule, "BEFORE DEFINING OPR ON last APP !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
					//updating onPauseRequest value with extraTimeMiliseconds
					schedule[schedule.length-1].opr = extraTime;

					giveMeMoreTimeFunc(extraTimeMiliseconds);
				}
				else if(message.time = 0){
					schedule[0].opr = 0;
				}
			break;

			case "paused":	
				if(pausedFlag === true){
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