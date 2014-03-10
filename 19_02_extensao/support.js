console.log("support.js is running...");

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

//loads an application on a background page
function openAppInBackgroundTab(tabUrl){
	chrome.tabs.create({ url: tabUrl, active: false }, function(tab){
		chrome.tabs.executeScript(tab.id, {file: "extensionScript.js", runAt: "document_start"});
	});
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

//push tab with ID "tabID" to the front
function activateBackgroundTab(tabId){
	chrome.tabs.update(tabId, {highlighted: true});
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