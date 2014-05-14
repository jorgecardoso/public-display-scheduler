console.log("options_actions is running...");

function addNewApp(id, name, url, duration, priority, background){
	var newApp = {};

	newApp.id = id;
	newApp.name = name;
	newApp.url = url;
	newApp.duration = duration;
	newApp.priority = priority;
	newApp.background = background;
	newApp.showMe = false;
	newApp.paused = false;
	newApp.opr = false;
	newApp.removeMe = false;

	if(background === true){
		createApp(newApp, sendOnCreateMsg);
		applications.push(newApp);
		printRedMsg("APPS", "New application added: ",url);
	}
	else{
		applications.push(newApp);	
		schedule.splice(schedule.length-1,0,newApp);
		printRedMsg("APPS", "New application added: ",url);
	}

	printArray(schedule, "UPDATED SCHEDULE AFTER ADDING AN APPLICATION");

	//saving application's data
	setDataStorage('appsData');

}

function removeApp(appId, appUrl){

	if(runningFlag === true){
		var paused = checkIfAppIsPaused(appId);
		var next = checkIfAppIsNext(appId);
		var tabId = getTabIdFromAppId(tabIdToAppInfo, appId);
		var currentAppTabId = getTabIdFromAppId(tabIdToAppInfo, schedule[schedule.length-1].id);
		var app = getAppFromTabId(applications, tabId);

		if(currentAppTabId === tabId){
			console.log("I'M THE RUNNING APPLICATION THEREFORE I'M GOING TO DO THIS: ");

			//remove all timers
			timerPauseRequest.removeTimer();
			timerPause.removeTimer();	
			window.clearTimeout(giveMeMoreTimeTimer);

			turnRemoveMeTrue(appId);

			if(schedule.length === 1){
				printRedMsg("SCHEDULER", "There are no more applications scheduled !","");
				printCommunicationMsg("Scheduler", ">> Sending", [app.url, messageOnPause, ""]);
				chrome.tabs.sendMessage(tabId, {state: messageOnPause, url: app.url});	
			}
			else{
				loadApp(schedule[0]);			
			}

		}
		else if(paused === true){
			console.log("I'M PAUSED THEREFORE I'M GOING TO DO THIS: ");
			turnRemoveMeTrue(appId);
			printCommunicationMsg("Scheduler", ">> Sending", [appUrl, messageOnUnload, ""]);
			chrome.tabs.sendMessage(tabId, {state: messageOnUnload, url: appUrl});
		}
		else if(paused === false && app.background === true){
			printCommunicationMsg("Scheduler", ">> Sending", [appUrl, messageOnDestroy, ""]);
			chrome.tabs.sendMessage(tabId, {state: messageOnDestroy, url: appUrl});		
		}
		else{
			console.log("I'M JUST CREATED OR LOADED THEREFORE I'M GOING TO DO THIS: ");
			//if app is not in hashtable, send onDestroy

			//else
			turnRemoveMeTrue(appId);
		}

		//saving application's data
		setDataStorage('appsData');
	}
	else{
		console.log("Scheduler is not running !");
		removeAppFrom(appId, "schedule");
		removeAppFrom(appId, "applications");

		//saving application's data
		setDataStorage('appsData');
	}
}

function updateApp(appId,updatedValues,boolBck){
	//updates applications array
	for(var i = 0; i < applications.length; i++){
		if(applications[i].id === appId){
			applications[i].name = updatedValues[0];
			applications[i].url = updatedValues[1];
			applications[i].duration = updatedValues[2];
			applications[i].priority = updatedValues[3];
			applications[i].background = updatedValues[4];
		}
	}

	printArray(applications, "APPLICATIONS AFTER UPDATE!");

	//updates schedule
	if(boolBck === false){
		console.log("I'M NOT A BACKGROUND APPLICATION !");

		for(var i = 0; i < schedule.length; i++){
			if(schedule[i].id === appId){
				schedule[i].name = updatedValues[0];
				schedule[i].url = updatedValues[1];
				schedule[i].duration = updatedValues[2];
				schedule[i].priority = updatedValues[3];
				schedule[i].background = updatedValues[4];
			}
		}
	}

	printArray(schedule, "SCHEDULE AFTER UPDATE!");

	//saving application's data
	setDataStorage('appsData');
}