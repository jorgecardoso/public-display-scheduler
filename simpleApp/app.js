//lifecycle functions
function onCreate(callback){
	var time = timeStamp();
	console.log(time + " | LIFECYCLE | onCreate of " + url + " is running...");
	document.getElementById("onCreateText").value='onCreate';
		
	setTimeout(function(){
		callback();
	},3000);
}

function onLoad(callback){
	console.log("LIFECYCLE | onLoad of " + url + " is running...");
	document.getElementById("onLoadText").value='onLoad';
	
	setTimeout(function(){
		callback();
	},3000);
}

function onResume(){
	console.log("LIFECYCLE | onResume of " + url + " is running...");
	setTimeout(function(){
			document.getElementById("onResumeText").value='onResume';
	},3000);
}

//calculates if more time is needed to display all jokes
function onPauseRequest(callback){
	console.log("LIFECYCLE | onPauseRequest of " + url + " is running...");
	document.getElementById("onPauseRequestText").value='onPauseRequest';
	
	time = 0;

	setTimeout(function(){
		callback();
	},3000);
}

function onPause(callback){
	console.log("LIFECYCLE | onPause of " + url + " is running...");
	document.getElementById("onPauseText").value='onPause';
	//clear all variables

	setTimeout(function(){
		callback();
	},3000);
}

function onUnload(callback){
	console.log("LIFECYCLE | onUnload of " + url + " is running...");
	document.getElementById("onUnloadText").value='onUnload';
	//clear all variables
	setTimeout(function(){
		callback();
	},3000);

	//callback();
}

function onDestroy(callback){
	console.log("LIFECYCLE | onDestroy of " + url + " is running...");
	//clear all variables
	callback();
}