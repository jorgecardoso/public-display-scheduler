console.log("scheduler.js is running...");

var appsReady = [];
var tabIdToURL = {};
var currentTabId = -1;
var hideNotificationTime = 10000;
var firstRun = true;
var options = "options.html";

var code = 'window.location.reload();';
var messageOnLoad = "onLoad";
var messageOnDisplay = "onDisplay";
var messageOnHideNotification = "onHideNotification";
var messageOnHide = "onHide";

//hardcoded schedules
var schedulesTest = [["http://localhost/05_03_simpleApp/", 30],["http://localhost/05_03_simpleAppJoke/", 30]];

var openOptions = function optionsPage(){
	chrome.tabs.create({ url: options, active: true });
}

var stopScheduler = function stop(){
	console.log("SCHEDULER | Closing...");
	chrome.management.setEnabled("aapkdefdejpmefgokkfgjidcgkdhoehi", false);
}

function addNewApp(url,duration){
	var url, duration;
	var newApplication = new Array();
	newApplication.push(url);
	newApplication.push(duration);
	console.log(newApplication.length);
	schedulesTest.push(newApplication);
	alert("APPS | Application " + url + " added successfully !");
}

var startScheduler = function starting(){
	console.log("SCHEDULER | Starting...");

	//get 1st application
	var appUrl = schedulesTest[0][0];
	console.log("SCHEDULER | Next app: " + appUrl);

	//open next app on a background tab
	openAppInBackgroundTab(appUrl);
}

function displayingApp(tabId){
	var nextAppUrl;

	//get url of next application
	var appUrl = tabIdToURL[tabId];
	console.log("SCHEDULER | Displaying app " + appUrl);

	//get duration of next app
	var appDuration = findDurationByUrl(schedulesTest,appUrl);

	//activate next app
	activateBackgroundTab(tabId,appUrl);

	//update 1st application of the list
	var currentApp = schedulesTest[0];
	//removes it
	schedulesTest.shift();
	//and push it to the end of the array of jobs
	schedulesTest.push(currentApp);

	var nextApp = schedulesTest[0];
	nextAppUrl = nextApp[0];
	console.log("SCHEDULER | Next app: " + nextAppUrl);

	/////////////////////////////////////////////
	//     Open next app in background tab     //

	isTabCreated(nextAppUrl).done(function(data){
		if(data === true){
			console.log("TABS | Tab with url " + nextAppUrl + " is already created!");
		}
		else{
			openAppInBackgroundTab(nextAppUrl);
		}
	});

	//                                         //
	/////////////////////////////////////////////

	//when job duration is almost done (10 seconds before)
	var timeHideNotification = new Timer(function(){
		var appReady = isAppReady(appsReady,schedulesTest[0][0]);

		if(appReady === true){
			nextAppUrl = schedulesTest[0][0];
		}
		else{
			//jump to another app after x seconds !
		}

		//send onHideNotification to current application
		var time = timeStamp();
		console.log(time + " | MESSAGES Extension | >> Sending message <" + messageOnHideNotification + "> to extensionScript (" + appUrl + " , " + tabId + ")");
		chrome.tabs.sendMessage(tabId, {state: messageOnHideNotification, url: appUrl});
	}, (appDuration * 1000) - hideNotificationTime);

	//when job duration is done
	var timer = new Timer(function() {

		/////////////////////////////////////////////
		//       Open next app on active tab       //

		var nextAppId = getTabIdFromUrl(tabIdToURL, nextAppUrl);
		displayingApp(nextAppId);
		//                                         //
		/////////////////////////////////////////////

		//send onHide message to current app before removing it
		chrome.tabs.sendMessage(tabId, {state: messageOnHide, url: appUrl});
		chrome.tabs.executeScript(tabId, {code: code}, function(array){
			chrome.tabs.executeScript(tabId, {file: "extensionScript.js", runAt: "document_start"});
		});

	}, appDuration * 1000);
}

function main(){
	//everytime a tab is created, id is stored in hashtable "tabIdToURL"
	chrome.tabs.onCreated.addListener(function(tab){
		tabIdToURL[tab.id] = tab.url; // also available as tab.id and changeInfo.url
	   	console.log("HASH | Tab " + tab.url + " with ID " + tab.id + " added!");
	});
	
	//everytime a tab is removed, id is removed from hashtable "tabIdToURL"
	chrome.tabs.onRemoved.addListener(function(tabId) {
	    delete tabIdToURL[tabId];
	    //console.log("HASH | Tab " + tabId + " was removed!");
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

		if(state === "hideReady"){
			console.log(time + " | MESSAGES Extension | << Receiving message <" + state + " , " + message.time + "> from extensionScript(" + url + " , " + id + ")");
		}
		else{
			console.log(time + " | MESSAGES Extension | << Receiving message <" + state + "> from extensionScript(" + url + " , " + id + ")");
		}

		switch(state){
			case "created":
				//send message onLoad
				var time = timeStamp();
		       	console.log(time + " | MESSAGES Extension | >> Sending message <" + messageOnLoad + "> to extensionScript (" + url + " , " + id + ")");
			   	chrome.tabs.sendMessage(id, {state: messageOnLoad, url: url});
			   	break;
			break;

			case "loaded":
				if(firstRun === true){
					firstRun = false;
					console.log("SCHEDULER | First run");
					displayingApp(id);
				}
				else{
					console.log("APPS | Adding " + url + " to array appsReady !");
					appsReady.push(url);
				}
	      		break;
			break;

			case "hideReady":
				if(message.time > 0){
					console.log("APPS | Application " + url + " needs more " + message.time + " seconds !");
					var extraTime = message.time;
					//seconds -> miliseconds
					var extraTimeMiliseconds = extraTime * 1000;
					//giveMeMoreTimeFunc(extraTimeMiliseconds);
				}
			break;

			case "not_loaded":
				//removes tab
				//chrome.tabs.remove(id);
			break;
		}
	});
}

main();

/////////////////////////////////////////////
//              SUPPORT.JS                 //
/////////////////////////////////////////////

//returns tab ID given an URL
function getTabIdFromUrl(hash, url) {
	var key;
	for (key in hash) {
		if (hash[key] === url) {
			return parseInt(key);
		}
	}
}

//returns the duration of the application "url"
function findDurationByUrl(apps,url){
	var duration;
	for(var i = 0; i < apps.length; i++){
		var aux = apps[i][0];
		if(aux === url){
			duration = apps[i][1];
			console.log("APPS | Next app duration: " + duration + " seconds");
		}
	}
	return duration;
}

//loads an application on a background page
function openAppInBackgroundTab(tabUrl){
	console.log("APPS | Opening application " + tabUrl + " on background tab...");
	chrome.tabs.create({ url: tabUrl, active: false }, function(tab){
		chrome.tabs.executeScript(tab.id, {file: "extensionScript.js", runAt: "document_start"});
	});
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

//push tab with ID "tabID" to the front
function activateBackgroundTab(tabId,url){
	chrome.tabs.update(tabId, {active: true}, function(tab){
		console.log("INSIDE activateBackgroundTab!");
		if(tab.status === "complete"){
			var time = timeStamp();
			console.log(time + " | MESSAGES Extension | >> Sending message <" + messageOnDisplay + "> to extensionScript");
	      	chrome.tabs.sendMessage(tabId,{state : messageOnDisplay, url: url});
		}
	});
}

function isAppReady(appsReady,url){
	var returnValue = false;
	for(var i = 0; i < appsReady.length; i++){
		if(url === appsReady[i]){
			returnValue = true;
		}
	}

	return returnValue;
}	

function isTabCreated(url){
	var def = $.Deferred();
	var value = false;
	chrome.tabs.query({}, function(tabs){
		for(var i = 0; i < tabs.length; i++){
			if(tabs[i].url == url){
				value = true;
			}
		}
		def.resolve(value);
		return value;
	});

	return def;
}	

/////////////////////////////////////////////
//               TIMER.JS                  //
/////////////////////////////////////////////

//advanced timer function
function Timer(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
        return 1;
    };

    this.resume = function() {
        start = new Date();
        timerId = window.setTimeout(callback, remaining);
    };

    this.resume();
}

//auxiliar function to count time on screen
function countingTime(){
	console.log("Counting seconds...");
}

//couting time on console
//var t=setInterval(countingTime,1000);
