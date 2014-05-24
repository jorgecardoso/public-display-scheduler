console.log("tabs.js is running...");

//get all opened tabs in scheduler's window
function getTabs(){
	chrome.tabs.query({}, function(tabs){
		for(var i = 0; i < tabs.length; i++){
			openedTabs.push(tabs[i].id);
		}
	});
}

//given an array with tabs IDs, closes all corresponding tabs
function closeTabs(arrayOfIds){
	for(var i = 0; i < arrayOfIds.length; i++){
		chrome.tabs.remove(arrayOfIds);
	}
}

//loads an application on a background page
function openAppInBackgroundTab(tabUrl){
	var def = $.Deferred();
	//console.log("APPS | Opening application " + tabUrl + " on background tab...");
	chrome.tabs.create({ url: tabUrl, active: false }, function(tab){
		chrome.tabs.executeScript(tab.id, {file: "extensionScript.js", runAt: "document_end"}, function(array){
			def.resolve(tab.id);
		});
	});

	return def;
}

//push tab with ID "tabID" to the front and sends message onResume
function activateBackgroundTab(tabId,url){
	chrome.tabs.update(tabId, {active: true}, function(tab){

		var regularApps = countingRegularApps(applications);

		///////////////////////////////////////////////////////////////////
		//                                                               //
		//      When there is ONLY one regular application scheduled     //
		//                                                               //
		///////////////////////////////////////////////////////////////////
		
		if(regularApps === 1){
			//if there is only one application scheduled, startTime will not be updated because the active tab doesn't change
			var startTime = getTime();
			//get startTime when application's tab becomes the active tab
			addStartTimeToHash(tab.id, startTime);
		}
		if(tab.status === "complete"){
			printCommunicationMsg("Scheduler", ">> Sending", [url, messageOnResume, ""]);
	      	chrome.tabs.sendMessage(tabId,{state : messageOnResume, url: url});
		}
	});
}

//given an application ID, checks if that application is already created (opened in a tab) 
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
	});

	return def;
}