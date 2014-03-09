//loads all applications on a background tab
function openAllAppsInBackground(arrayOfApps){
	for(var i = 0; i < arrayOfApps.length; i++){
		chrome.tabs.create({ url: arrayOfApps[i][0], active: false }, function(tab){
			chrome.tabs.executeScript(tab.id, {file: "extensionScript.js", runAt: "document_start"});
		});
	}
}

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
			console.log("Duration of job " + aux + " is " + duration + " seconds.");
		}
	}
	return duration;
}

//push tab with ID "tabID" to the front
function activateBackgroundTab(tabId){
	chrome.tabs.update(tabId, {highlighted: true}, function(){
		
	});
}

function tabIsInHash(hash,tabId){
	var key;
	for(key in hash){
		if(parseInt(key) === tabId){
			return true;
		}
	}
	return false;
}

//loads an application on a background page (onLoad starts running when app is loaded in background)
function openAppsInBackgroundTab(nextOccurrences, number){
	for(var i = 0; i < number; i++){
		chrome.tabs.create({ url: nextOccurrences[i][0], active: false }, function(tab){
			chrome.tabs.executeScript(tab.id, {file: "extensionScript.js", runAt: "document_start"});
		});
	}
}

//open second app of list of jobs
function open2ndAppInBackground(nextOccurrences){
	chrome.tabs.create({ url: nextOccurrences[1][0], active: false }, function(tab){
		chrome.tabs.executeScript(tab.id, {file: "extensionScript.js", runAt: "document_start"});
	});
}