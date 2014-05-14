console.log("apps.js is running...");

//given an application id, returns true if applications of paused and false otherwise
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

//given an application id, returns true if the application is the next to display and false othwerwise
function checkIfAppIsNext(appId){
	if(schedule[0].id === appId)
		return true;
	else
		return false;
}

//given an application id, turns "removeMe" atribute true
function turnRemoveMeTrue(appId){
	for(var i = 0; i < schedule.length; i++){
		if(schedule[i].id === appId)
			schedule[i].removeMe = true;
	}
}

//returns the last application to be display in "schedule" at the moment
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

//loads all background tabs one by one given an array of applications
function loadBckApps(apps){
	for(var i = 0; i < apps.length; i++){
		if(apps[i].background === true){
			$(document).queue('bckApps', loadBckApp(apps[i])); //createApp(apps[i],sendOnCreateMsg));
		}
	}
}

//loads one background tab given an applications
function loadBckApp(app){
	var bckTabId = getTabIdFromAppId(tabIdToAppInfo, app.id);

	isTabCreated(bckTabId).done(function(data){
		if(data === true){
			printRedMsg("TABS", "This application is already created", app.url);
		}
		else{
			createApp(app, sendOnCreateMsg);
		}
	});
}

//sends message onCreate to application in tab "TabId" with URL equal to "appUrl"
function sendOnCreateMsg(tabId,appUrl){
	chrome.tabs.sendMessage(tabId, {state: messageOnCreate, url: appUrl});			
}

//returns true if the priority of "newApp" is bigger than "currentApp", otherwise returns false
function isPriorityBigger(newApp,currentApp){
	if(newApp.priority > currentApp.priority)
		return true;
	else
		return false;
}

//returns true if the priority of "newApp" is smaller than "currentApp", otherwise, returns false
function isPrioritySmaller(newApp,currentApp){
	if(newApp.priority < currentApp.priority)
		return true;
	else
		//if priority is bigger or equal, returns false
		return false;
}

//adds an application that requested airtime to the schedule according to its priority (smaller priorities === biggest priority)
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
				addShowMeAppFlag = true;
				//add new showMe app to the top of the list
				schedule.splice(i,0,newApp);
				break;
			}	
		}

		if(addShowMeAppFlag === false){
			schedule.splice(number,0,newApp);
		}	
	}
}

//returns and array with all applications that requested airtime
function getAllShowMeApps(schedule){
	var result = 0;

	for(var i = 0; i < schedule.length; i++){
		if(schedule[i].showMe === true)
			result++;
	}

	return result;
}

//given an application id, returns the value of "removeMe" atribute
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

//removes an application from a given array
function removeAppFrom(appId, array){

	if(array === "applications"){
		for (var i = 0; i < applications.length; i++){
			if(applications[i].id === appId){
				applications.splice(i,1);	
			}
		}

		if(applications.length === 0){
			printRedMsg("SCHDULER", "There are no more applications !","");
		}else{
			printArray(applications, "APPLICATIONS ARRAY AFTER REMOVING ONE APPLICATION");	
		}
	}

	if(array === "schedule"){
		for (var i = 0; i < schedule.length; i++){
			if(schedule[i].id === appId){
				schedule.splice(i,1);
			}
		}

		if(schedule.length === 0){
			printRedMsg("SCHDULER", "Schedule is empty !","");
		}
		else{
			printArray(schedule, "SCHEDULE AFTER REMOVING ONE APPLICATION");
		}
	}
}

//returns the biggest ID of applications used so far
function getBiggestId(){
	var id = 0;
	for(var i = 0; i < applications.length; i++){
		if(applications[i].id > id){
			id = applications[i].id;
		}
	}

	return id;
}