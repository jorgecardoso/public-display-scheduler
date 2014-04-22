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

//flags
var firstRunFlag = true;
var addShowMeAppFlag = false;
var pausedFlag = false;

//hardcoded schedules
var applications = [
{id: 0, url: "http://localhost/05_03_simpleAppJoke/", duration: 15, priority: 2, background: false, showMe: false, paused: false, opr: false},
{id: 1, url: "http://localhost/05_03_simpleBackgroundApp2/", duration: 15, priority: 1, background: true, showMe: false, paused: false, opr: false},
{id: 2, url: "http://localhost/05_03_simpleAppVideo2/", duration: 30, priority: 3, background: false, showMe: false, paused: false, opr: false},
{id: 3, url:"http://localhost/05_03_simpleBackgroundApp/", duration: 10, priority: 3, background: true, showMe: false, paused: false, opr: false},
{id: 4, url: "http://localhost/05_03_simpleApp/", duration: 30, priority: 3, background: false, showMe: false, paused: false, opr: false},
];

var openOptions = function optionsPage(){
	chrome.tabs.create({ url: options, active: true });
}

var stopScheduler = function stop(){

}

function addNewApp(url,duration,priority,background){
	var newApp = {};

	newApp.id = 5;
	newApp.url = url;
	newApp.duration = duration;
	newApp.priority = priority;
	newApp.background = background;
	newApp.showMe = false;
	newApp.paused = false;

	//schedule.push(newApp);
	applications.push(newApp);
	schedule.splice(schedule.length-1,0,newApp);
	alert("NEW APPLICATION " + url + " ADDED ! Duration: " + duration + " | Priority: " + priority + " | Background: " + background);
}

var startScheduler = function starting(){
	console.log("SCHEDULER | Starting...");

	//get initial schedule with all regular apps
	schedule = initialSchedule(applications);
	console.log("SCHEDULE | INITIAL SCHEDULE");
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
   	console.log(time + " | MESSAGES " + app.url + " | >> Sending <" + messageOnLoad + ">");
   	chrome.tabs.sendMessage(tabId, {state: messageOnLoad, url: app.url});

   	//handles extra time on onPauseRequest callback
	giveMeMoreTimeFunc = function moreTimeFunc(extraTime){
		//var receivedMessage = message.data;
		//var extraTime = receivedMessage.timeField;
		console.log("GIVE ME MORE TIME FUNC | Received message asking for more time: " + extraTime);
		//pause current timeout
		console.log("GIVE ME MORE TIME FUNC | Pausing current job...");
		var paused = timerPause.pause();
		
		//if timer is paused			
		if(paused === 1){
			//resume job after extraTime is elapsed
			giveMeMoreTimeTimer = setTimeout(function(){
				timerPause.resume();
				//removes listener [not working correctly!]
				//console.log("-> Removing listener <-");
				console.log("GIVE ME MORE TIME FUNC | Resuming job...");
				//window.removeEventListener('message', moreTimeFunc);
			},extraTime);
		}
	}
}

function resumeApp(app){
	console.log("SCHEDULER | Resuming app " + app.url);

	//resume paused application
	var tabId =  getTabIdFromAppId(tabIdToAppInfo, app.id);
	activateBackgroundTab(tabId,app.url);

	var currentApp = schedule[schedule.length-1];
	var currentTabId = getTabIdFromAppId(tabIdToAppInfo,currentApp.id);
	//send onPause to current application 
	var time = timeStamp();
	console.log(time + " | MESSAGES " + currentApp.url + " | >> Sending <" + messageOnPause + ">");
	chrome.tabs.sendMessage(currentTabId, {state: messageOnPause, url: currentApp.url});

	app.paused = false;
	updateSchedule(schedule);
	console.log("SCHEDULE | UPDATED SCHEDULE !");
	printArray(schedule);

	console.log("APPS | DURATION OF APPLICATION " + app.url + ": " + app.duration);
	var airTime = getAppAirtime(appsAirtime,app.id);
	console.log("APPS | AIRTIME OF APPLICATION " + app.url + ": " + airTime);

	if(schedule[schedule.length-1].opr != false){
		console.log("EXTRA TIME ALREADY OCCURED !!!!!!!!!!!!!!!!!!!!! | EXTRA TIME VALUE: " + schedule[schedule.length-1].opr);
		console.log("APPS | DURATION OF APP + EXTRA TIME: " + (app.duration * 1000 + schedule[schedule.length-1].opr));
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
		console.log("EXTRA TIME DIDN'T OCCURED YET !!!!!!!!!!!!!!!!!!!");
		appDurationRemainder = (app.duration * 1000) - airTime;

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
			console.log(time + " | MESSAGES " + app.url + " | >> Sending message <" + messageOnPauseRequest + ">");
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

	console.log("APPS | DURATION OF APPLICATION AFTER PAUSE: " + appDurationRemainder);

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

		var currentApp;
		var showMeApp;
		var showMeAppCopy;
		var nextApp;

		if(state === "pauseReady"){
			console.log(time + " | MESSAGES " + url + " | << Receiving <" + state + " , " + message.time + ">");
		}
		else{
			console.log(time + " | MESSAGES " + url + " | << Receiving <" + state + ">");
		}

		switch(state){
			case "showMe":
			console.log("APPS | Application " + url + " called SHOW ME !");
			//get showMe application
			showMeApp = getAppFromTabId(applications,id);
			showMeAppCopy = jQuery.extend({}, showMeApp);
			showMeAppCopy.showMe = true;
			nextApp = schedule[0];

			//get current application
			currentApp = schedule[schedule.length-1];

			//if showMe application is already running or is the next application in the list, ignore...
			if(currentApp.id === showMeApp.id || nextApp.id === showMeApp.id){
				console.log("SCHEDULER | Application " + currentApp.url + " is already showing or is the next in line ! So, ignore SHOW ME...");
			}
			else if(checkIfPaused(showMeApp)){
				console.log("SCHEDULER | Application " + currentApp.url + " is PAUSED ! So, ignore SHOW ME...");
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

					console.log("SCHEDULE | UPDATED SCHEDULE AFTER ADDING SHOW ME APP!");
					printArray(schedule);
				}
				else{
					//add current application to pausedApps array
					//pausedApps.push(currentApp);

					pausedFlag = true;

					currentApp.paused = true;
					updateSchedulePaused(schedule);
					schedule.push(showMeAppCopy);

					console.log(time + "| SCHEDULE | UPDATED SCHEDULE AFTER AN APPLICATION IS INTERRUPED !");
					printArray(schedule);

					timerPauseRequest.removeTimer();
					timerPause.removeTimer();	
					window.clearTimeout(giveMeMoreTimeTimer);

					loadApp(showMeAppCopy);			
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
				var appId = getAppFromTabId(applications,id);

				console.log("APPS | Getting start time of application " + appId.url);
				startTime = getTime();

				addStartTimeToHash(appId.id,startTime);

				console.log("APPS | PRINTING APPS AIRTIME !");
				printArray(appsAirtime);

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
					var time = timeStamp();
					console.log(time + " | MESSAGES " + url + " | << Receiving <" + state + " , " + message.time + ">");
					console.log(time + " | MESSAGES " + currentApp.url + " | >> Sending <" + messageOnPause + ">");
					chrome.tabs.sendMessage(currentAppTabId, {state: messageOnPause, url: currentApp.url});
				}

				//if the application was not interrupted
				if(pausedFlag === false){
					//update schedule
					updateSchedule(schedule);
					var time = timeStamp();
					console.log(time + " | UPDATED SCHEDULE");
					printArray(schedule);
				}
				else{
					//pausedFlag = false;
				}

				console.log("APP DURATIONNNNNNNNNNNNNNNNNNNNNN: " + appDuration);

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
					console.log(time + " | MESSAGES " + url + " | >> Sending <" + messageOnPauseRequest + ">");
					chrome.tabs.sendMessage(id, {state: messageOnPauseRequest, url: url});
				}, (appDuration * 1000) - hideNotificationTime);

				//when apps duration is done
				timerPause = new Timer(function(){
					console.log("APPS | NEXT APP ID: " + schedule[0].id + " PAUSED: " + schedule[0].paused);
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
				console.log("Printing !!!!!!!!!!!!!!!!!!!!!!!!!!!!! Dhgasifygvausfbvdaushaushyfbgaushyfbgayksgbf");
				printArray(schedule);

				if(message.time > 0){
					console.log("APPS | Application " + url + " needs " + message.time + " seconds more !");
					
					extraTime = message.time;

					//seconds -> miliseconds
					extraTimeMiliseconds = extraTime * 1000;

					//updating onPauseRequest value with extraTimeMiliseconds
					schedule[schedule.length-1].opr = extraTimeMiliseconds;

					giveMeMoreTimeFunc(extraTimeMiliseconds);

					console.log("Printing !!!!!!!!!!!!!!!!!!!!!!!!!!!!! Dhgasifygvausfbvdaushaushyfbgaushyfbgayksgbf");
					printArray(schedule);
				}
				else if(message.time = 0){
					schedule[schedule.length-1].opr = 0;
				}
			break;

			case "paused":
				var time = timeStamp();
				//var unloadingApp = getAppFromTabId(applications,id);
				
				if(pausedFlag === true){
					schedule[schedule.length-1].paused = true;
					pausedFlag = false;
				}

				console.log(time + "ID: " + getAppFromTabId(applications,id) + " | UNLOADIND APP: " + url + " PAUSED: " + schedule[schedule.length-1].paused + "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
				
				//if the current application was not interrupted
				if(schedule[schedule.length-1].paused === false){
					//change onPauseRequest flag to false
					schedule[schedule.length-1].opr = false;
					//send onUnload message
					var time = timeStamp();
				    console.log(time + " | MESSAGES " + url + " | >> Sending <" + messageOnUnload + ">");
					chrome.tabs.sendMessage(id, {state: messageOnUnload, url: url});
				}
				else{
					console.log("application is paused therefore it shouldn't be unload yet!!!");
				}
			break;
		}
	});
}

main();