console.log("support.js is running...");

function printArray(array, text){
	var time = timeStamp();
	console.log("%s | SCHEDULE  | %s", time, text);
	for(var i = 0; i < array.length; i++){
		console.log(array[i]);
	}
}

function printSimpleMsg(type, message, arg){
	var time = timeStamp();
	console.log("%s | %s | %s %s", time, type, message, arg);
}

function printCommunicationMsg(from, message, arg){
	var time = timeStamp();
	console.log("%c%s | COMMUNICATION %s | %s %s < %s %s>", "color: blue ", time, from, arg[0], message, arg[1], arg[2]);
}

function printRedMsg(type, message, arg){
	var time = timeStamp();
	console.log("%c%s | %s | %s %s", "color: red", time, type, message, arg);
}

//get all opened tabs in scheduler's window
function getTabs(){
	chrome.tabs.query({}, function(tabs){
		for(var i = 0; i < tabs.length; i++){
			openedTabs.push(tabs[i].id);
		}
	});
}

//close all tabs in "arrayOfIds"
function closeTabs(arrayOfIds){
	for(var i = 0; i < arrayOfIds.length; i++){
		chrome.tabs.remove(arrayOfIds);
	}
}

function checkIfAppIsPaused(appId){
	for(var i = 0; i < schedule.length-1; i++){
		if(schedule[i].id === appId){
			if(schedule[i].paused === true)
				return true;
			else
				return false;
		}
	}
}

function checkIfAppIsNext(appId){
	if(schedule[0].id === appId)
		return true;
	else
		return false;
}

function turnRemoveMeTrue(appId){
	for(var i = 0; i < schedule.length; i++){
		if(schedule[i].id === appId)
			schedule[i].removeMe = true;
	}
}

/*function checkIfPaused(appId){
	var result = false;
	for(var i = 0; i < schedule.length; i++){
		if(schedule[i].paused === true){
			if(schedule[i].id === appId)
				result = true;
		}
	}

	return result;
}*/

function closeScheduler(){
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
	    		printCommunicationMsg("Scheduler", ">> Sending", [appUrl, messageOnUnload, ""]);
				chrome.tabs.sendMessage(tabId, {state: messageOnUnload, url: appUrl});
	    	}
	    	else{
				printCommunicationMsg("Scheduler", ">> Sending", [appUrl, messageOnDestroy, ""]);
				chrome.tabs.sendMessage(tabId, {state: messageOnDestroy, url: appUrl}); 
	    	}   	
	    }
	});
}

function updateSchedule(schedule){
	//if current app is a "showMe" app
	var currentApp = schedule[schedule.length-1];
	if(currentApp.showMe === true)
		//delete uit from the schedule
		schedule.pop();
	
	//get first application of the list (next application to run)
	var nextApp = schedule[0];
	//removes it
	schedule.shift();
	//and push it to the end of the array of jobs
	schedule.push(nextApp);
}

function updateSchedulePaused(schedule){
	//get stopped application (last one)
	var stoppedApp = schedule[schedule.length-1];
	//remove it from schedule
	schedule.pop();
	//push it to the beginning of the schedule
	schedule.unshift(stoppedApp);
}

//given an array of apps, returns an array with all regular applications
function initialSchedule(apps){
	var schedule = [];
	for (var i = 0; i < apps.length; i++){
		if(apps[i].background === false)
			schedule.push(apps[i]);
		else{
			backgroundApps.push(apps[i]);
		}
	}

	return schedule;
}

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
			console.log("APP ID: " + app.id);
			appInfo.push(app.url);
			console.log("APP URL: " + app.url);

			console.log("TAB ID: " + tab.id);

			addAppToHash(tab.id,appInfo);

			//send message onCreate to the created tab
			callback(tab.id,app.url);
		});
	});
}

function pickLastApp(schedule){
	var lastApp = schedule[schedule.length - 1];
	//last application of the list
	var penultimateApp = schedule[schedule.length - 2];

	//if the last application is currently running
	if(lastApp.id === penultimateApp.id){
		return schedule[schedule.length - 3];
	}
	else{
		return penultimateApp;
	}
}

//load all background tabs one by one
function loadBckApps(apps){
	for(var i = 0; i < apps.length; i++){
		if(apps[i].background === true){
			$(document).queue('bckApps', createApp(apps[i],sendOnCreateMsg));			
		}
	}
}

//add an application to hash table (tabIdToAppInfo) given a table id and an url
function addAppToHash(tabId,appInfo){
		tabIdToAppInfo[tabId] = appInfo; // also available as tab.id and changeInfo.url
	   	//console.log("HASH | Tab " + appInfo[1] + " with ID " + tabId + " added !");
};

//send message onCreate to all background applications loaded in inactive tabs
function sendOnCreateMsg(tabId,appUrl){
	chrome.tabs.sendMessage(tabId, {state: messageOnCreate, url: appUrl});			
}

function getAppFromTabId(apps,tabId){
	var app;
	var appInfo = tabIdToAppInfo[tabId];
	for(var i = 0; i < apps.length; i++){
		if(apps[i].id === appInfo[0] && apps[i].url === appInfo[1]){
			app = apps[i];
			return app;
		}
	}
}

//returns tab ID given an URL
function getTabIdFromAppId(hash, id) {
	var key;
	for (key in hash) {
		if (hash[key][0] === id) {
			return parseInt(key);
		}
	}
}

//loads an application on a background page
function openAppInBackgroundTab(tabUrl){
	var def = $.Deferred();
	//console.log("APPS | Opening application " + tabUrl + " on background tab...");
	chrome.tabs.create({ url: tabUrl, active: false }, function(tab){
		chrome.tabs.executeScript(tab.id, {file: "extensionScript.js", runAt: "document_end"}, function(array){
			var time = timeStamp();
			def.resolve(tab.id);
		});
	});

	return def;
}

//push tab with ID "tabID" to the front
function activateBackgroundTab(tabId,url){
	chrome.tabs.update(tabId, {active: true}, function(tab){
		if(tab.status === "complete"){
			printCommunicationMsg("Scheduler", ">> Sending", [url, messageOnResume, ""]);
	      	chrome.tabs.sendMessage(tabId,{state : messageOnResume, url: url});
		}
	});
}

//given an url, checks 
function isTabCreated(id){
	var def = $.Deferred();
	var value = false;
	chrome.tabs.query({}, function(tabs){
		for(var i = 0; i < tabs.length; i++){
			if(tabs[i].id === id){
				value = true;
			}
		}
		def.resolve(value);
		//return value;
	});

	return def;
}

//returns true if the priority of newApp is bigger than currentApp, otherwise returns false
function isPriorityBigger(newApp,currentApp){
	if(newApp.priority > currentApp.priority)
		return true;
	else
		return false;
}

function isPrioritySmaller(newApp,currentApp){
	console.log("NEW APP PRIORITY: " + newApp.priority);
	console.log("TOP APP PRIORITY: " + currentApp.priority);

	if(newApp.priority < currentApp.priority)
		return true;
	else
		//if priority is bigger or equal, returns false
		return false;
}

function addShowMeApp(newApp){
	addShowMeAppFlag = false;

	//if there isn't any showMe application waiting
	if(schedule[0].showMe === false){
		//add new app to the beginning of the array
		schedule.unshift(newApp);
	}
	else{
		var number = getAllShowMeApps(schedule);

		for(var i = 0; i < number; i++){
			var app = schedule[i];
			var compare = isPrioritySmaller(newApp,app);	
			//if showMe app priority is smaller than the next showMe app waiting
			if(compare === true){
				console.log("PRIORITY IS SMALLER !!!!!!!!!");
				addShowMeAppFlag = true;
				//add new showMe app to the top of the list
				schedule.splice(i,0,newApp);
				break;
			}	
		}

		if(addShowMeAppFlag === false){
			console.log("PRIORITY IS BIGGER !!!!!!!!!!!!");
			schedule.splice(number,0,newApp);
		}	
	}
}

function getAllShowMeApps(schedule){
	var result = 0;

	for(var i = 0; i < schedule.length; i++){
		if(schedule[i].showMe === true)
			result++;
	}

	return result;
}

function getTime(){
	var time = new Date().getTime();
	return time;
}

function addStartTimeToHash(appId,startTime){	
	var airtimeValue = [];	

	airtimeValue.push(appId);
	airtimeValue.push(startTime);

	for(var i = 0; i < appsAirtime.length; i++){
		if(appsAirtime[i][0] === appId)
			appsAirtime.splice(i, 1);
	}

	appsAirtime.push(airtimeValue);
}

function getLoadedTime(times,id){
	var time;

	for(var i = 0; i < times.length; i++){
		var time = times[i];
		if(time[0] === id){
			time = time[1];
		}
	}

	return time;
}

function getAppAirtime(times,id){
	var airtime;

	for(var i = 0; i < times.length; i++){
		var time = times[i];
		if(time[0] === id){
			var nextAppLoadedTime = times[i+1][1];
			airtime = nextAppLoadedTime - times[i][1];
		}
	}

	return airtime;
}

function checkRemoveMe(appId){
	for(var i = 0; i < schedule.length; i++){
		if(appId === schedule[i].id){
			if(schedule[i].removeMe === true)
				return true;
			else
				return false;
		}
	}
}

function removeAppFrom(appId, array){

	if(array === "applications"){
		for (var i = 0; i < applications.length; i++){
			if(applications[i].id === appId){
				applications.splice(i,1);	
			}
		}

		printArray(applications, "APPLICATIONS ARRAY AFTER REMOVING ONE APPLICATION");
	}

	if(array === "schedule"){
		for (var i = 0; i < schedule.length; i++){
			if(schedule[i].id === appId){
				schedule.splice(i,1);
			}
		}

		printArray(schedule, "SCHDULE AFTER REMOVING ONE APPLICATION");
	}
}

function getBiggestId(){
	var id = 0;
	for(var i = 0; i < applications.length; i++){
		if(applications[i].id > id){
			id = applications[i].id;
		}
	}

	return id;
}

function timeStamp() {
	// Create a date object with the current time
	var now = new Date();

	// Create an array with the current hour, minute and second
	var time = [ now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds() ];

	// Convert hour from military time
	time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;

	// If hour is 0, set it to 12
	time[0] = time[0] || 12;

	// If seconds and minutes are less than 10, add a zero
	for ( var i = 1; i < 3; i++ ) {
		if ( time[i] < 10 ) {
			time[i] = "0" + time[i];
		}
	}

	// Return the formatted string
	return  time.join(":");
}