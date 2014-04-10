console.log("support.js is running...");

function printArray(array){
	for(var i = 0; i < array.length; i++){
		console.log(array[i]);
	}
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
	}

	return schedule;
}

//given an application and index, creates an inactive tab with the application
function createApp(app,callback){
	chrome.tabs.create({ url: app.url, active: false}, function(tab){
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
	   	console.log("HASH | Tab " + appInfo[1] + " with ID " + tabId + " added !");
};

//send message onCreate to all background applications loaded in inactive tabs
function sendOnCreateMsg(tabId,appUrl){
	chrome.tabs.sendMessage(tabId, {state: messageOnCreate, url: appUrl});			
}

function getAppFromTabId(apps,tabId){
	var app;
	var appInfo = tabIdToAppInfo[tabId];
	for(var i = 0; i < apps.length; i++){
		if(i === appInfo[0] && apps[i].url === appInfo[1]){
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
	console.log("APPS | Opening application " + tabUrl + " on background tab...");
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
			var time = timeStamp();
			console.log(time + " | MESSAGES Extension | >> Sending message <" + messageOnResume + "> to extensionScript of " + url);
	      	chrome.tabs.sendMessage(tabId,{state : messageOnResume, url: url});
		}
	});
}

//given an url, checks 
function isTabCreated(url){
	var def = $.Deferred();
	var value = false;
	chrome.tabs.query({}, function(tabs){
		for(var i = 0; i < tabs.length; i++){
			if(tabs[i].url === url){
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
	if(newApp.priority < currentApp.priority)
		return false;
	else
		//if priority is bigger or equal, returns false
		return true;
}

function addShowMeApp(newApp){
	addShowMeAppFlag = false;

	//if there isn't any showMe application waiting
	if(schedule[0].showMe === false){
		console.log("SHOW ME | There isn't any showMe apps waiting !");
		//add new app to the beginning of the array
		schedule.unshift(newApp);
	}
	else{
		var number = getAllShowMeApps(schedule);

		for(var i = 0; i < number; i++){
			var app = schedule[i];
			var compare = isPrioritySmaller(newApp,app);	
			//if showMe app priority is smaller than the next showMe app waiting
			if(compare === false){
				addShowMeAppFlag = true;
				//add new showMe app to the top of the list
				schedule.splice(i,0,newApp);
				break;
			}	
		}

		if(addShowMeAppFlag === false){
			console.log("LAST ITERATION!!!!!!!!!!!!!!!!!!!!");
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

function checkIfPaused(app){
	var result = false;
	for(var i = 0; i < schedule.length; i++){
		if(schedule[i].paused === true){
			if(schedule[i].id === app.id)
				result = true;
		}
	}

	return result;
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