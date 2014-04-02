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
		//releaseMe();
	},6000);
}

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

	setTimeout(function(){
		callback();
	},3000);
}

function onUnload(){
	console.log("LIFECYCLE | onUnload of " + url + " is running...");
	document.getElementById("onUnloadText").value='onUnload';
	
	//clear all variables
	setTimeout(function(){
		document.getElementById("onLoadText").value='';
		document.getElementById("onResumeText").value='';
		document.getElementById("onPauseRequestText").value='';
		document.getElementById("onPauseText").value='';
		document.getElementById("onUnloadText").value='';
	},2000);
}

function onDestroy(callback){
	console.log("LIFECYCLE | onDestroy of " + url + " is running...");
	callback();
}