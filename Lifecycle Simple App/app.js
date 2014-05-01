//lifecycle functions
function onCreate(){
	var time = timeStamp();
	console.log(time + " | LIFECYCLE | onCreate of " + url + " is running...");

	setTimeout(function(){
		document.getElementById("onCreateText").value='onCreate';
	},3000);
}

function onLoad(loaded){
	console.log("LIFECYCLE | onLoad of " + url + " is running...");

	setTimeout(function(){
		document.getElementById("onLoadText").value='onLoad';
	},3000);
	
	setTimeout(function(){
		loaded();
	},3000);
}

function onResume(){
	console.log("LIFECYCLE | onResume of " + url + " is running...");

	setTimeout(function(){
		document.getElementById("onResumeText").value='onResume';
	},3000);

	setTimeout(function(){
		showMe();
	},27000);
}

function onPauseRequest(){
	console.log("LIFECYCLE | onPauseRequest of " + url + " is running...");

	setTimeout(function(){
		document.getElementById("onPauseRequestText").value='onPauseRequest';
	},3000);

	return 0;
}

function onPause(){
	console.log("LIFECYCLE | onPause of " + url + " is running...");

	setTimeout(function(){
		document.getElementById("onPauseText").value='onPause';	
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

function onDestroy(destroyReady){
	console.log("LIFECYCLE | onDestroy of " + url + " is running...");
	destroyReady();
}