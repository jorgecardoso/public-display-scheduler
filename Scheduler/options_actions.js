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
			sendOnUnloadMsg(tabId, appId, appUrl);
			//printCommunicationMsg("Scheduler", ">> Sending", [appUrl, messageOnUnload, ""]);
			//chrome.tabs.sendMessage(tabId, {state: messageOnUnload, url: appUrl});
		}
		else if(paused === false && app.background === true){
			sendOnDestroyMsg(tabId, app.id, app.url);
			//printCommunicationMsg("Scheduler", ">> Sending", [appUrl, messageOnDestroy, ""]);
			//chrome.tabs.sendMessage(tabId, {state: messageOnDestroy, url: appUrl});		
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

function updateApplicationData(appId, updatedData){
	//updates applications array
	for(var i = 0; i < applications.length; i++){
		if(applications[i].id === appId){
			applications[i].name = updatedData[0];
			applications[i].url = updatedData[1];
			applications[i].duration = updatedData[2];
			applications[i].priority = updatedData[3];
			applications[i].background = updatedData[4];
		}
	}	
}

function updateApp(appId,updatedValues,boolBck){
	//get current application data
	var app = getAppFromAppId(applications, appId);
	console.log(app);
	console.log("NOVO VALOR: " + updatedValues[4]);

	//if current value of background atribute is "true" and updated value is "false"
	//application is added to schedule array
	if(app.background === true && updatedValues[4] === false){
		console.log("I WAS TRUE NOW I'M FALSE !");
		updateApplicationData(app.id, updatedValues);
		schedule.splice(schedule.length-1,0,app);
	}
	else if(app.background === false && updatedValues[4] === true){
		console.log("I WAS FALSE, NOW I'M TRUE!");
		updateApplicationData(app.id, updatedValues);
		removeAppFrom(app.id, "schedule");
	}
	//if background application's value remains the same
	else{
		console.log("I REMAINN WITH THE SAME VALUE !");
		updateApplicationData(app.id, updatedValues);

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
	}

	printArray(applications, "APPLICATIONS AFTER UPDATE!");

	printArray(schedule, "SCHEDULE AFTER UPDATE!");

	//saving application's data
	setDataStorage('appsData');
}