console.log("schedule.js is running...");

//updates the schedule pushing the first element to the end (last element is the next one to display)
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

//updates the schedule when an application is paused
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