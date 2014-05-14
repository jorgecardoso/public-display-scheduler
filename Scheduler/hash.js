console.log("hash.js is running...");

//adds an application to hash table (tabIdToAppInfo) given a tab ID and an array with the application ID and URL
function addAppToHash(tabId,appInfo){
		tabIdToAppInfo[tabId] = appInfo; 
};

//given the array "applications" and a tab ID, returns the corresponding application
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

//returns tab ID given an application ID
function getTabIdFromAppId(hash, id) {
	var key;
	for (key in hash) {
		if (hash[key][0] === id) {
			return parseInt(key);
		}
	}
}