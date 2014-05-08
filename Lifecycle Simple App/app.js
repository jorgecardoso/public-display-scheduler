//lifecycle functions
function onCreate(){
	var time = timeStamp();
	console.log(time + " | LIFECYCLE | onCreate of " + url + " is running...");

	document.getElementById("onCreateText").value='onCreate';
}

function onLoad(loaded){
	console.log("LIFECYCLE | onLoad of " + url + " is running...");

	document.getElementById("onLoadText").value='onLoad';
	
	setTimeout(function(){
		loaded();
	},3000);
}

function onResume(){
	console.log("LIFECYCLE | onResume of " + url + " is running...");

	document.getElementById("onResumeText").value='onResume';

	setTimeout(function(){
		showMe();
	},27000);
}

function onPauseRequest(){
	console.log("LIFECYCLE | onPauseRequest of " + url + " is running...");

	document.getElementById("onPauseRequestText").value='onPauseRequest';

	return 0;
}

function onPause(){
	console.log("LIFECYCLE | onPause of " + url + " is running...");
	
	document.getElementById("onPauseText").value='onPause';	
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

function onDestroy(destroyReady){
	console.log("LIFECYCLE | onDestroy of " + url + " is running...");
	destroyReady();
}