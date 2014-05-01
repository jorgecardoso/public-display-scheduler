//global variables
var counter = 0;
var jokes = [];
var i = 0; 
var jokeDuration = 10000;
var showedJokes = 0;
var randomNumber;
var title;
var description;
var videoID = [];
var ids = ["Jwj5KhF1Hhk","9ZVwJfkM0Eg","brLuH74fjlw","wZqE2wm2skU","wCkerYMffMo"];
var id;
window.videoDuration = 0;
window.secondsEllapsed = 0;
var appStopped = 0;
var secondsTimer = null;
window.startTime;
window.pausedTime;
window.pauseRequestTime;

//get a random number between min and max
function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//process received answered from the server
function functionWithData(data) {
	var deferred = $.Deferred();

	//get video duration in seconds
	window.videoDuration = data.entry.media$group.yt$duration.seconds;
	window.videoDuration = window.videoDuration*1000;

	//extra 2 seconds given automatically
	window.videoDuration = window.videoDuration - 2000;
	console.log("VIDEO DURATION IN MILISECONDS: " + window.videoDuration);

	deferred.resolve();
	return deferred.promise();	
};

function pause() {
    swfobject.getObjectById('randomVideo').pauseVideo();
}

function resume(){
	swfobject.getObjectById('randomVideo').playVideo();
}

//lifecycle functions
function onCreate(){
	console.log("LIFECYCLE | onCreate of " + document.URL + " is running...");
	setTimeout(function(){
		//showMe();
	},60000);
}

function onLoad(loaded){
	console.log("LIFECYCLE | onLoad of " + document.URL + " is running...");

	var c = document.getElementById("randomVideo");
	
	//if div "randomVideo" doesn't exist, create it
	if (c === null) {
		var d = document.createElement("div");
		d.setAttribute("id", "randomVideo");
		document.getElementById("content-container").appendChild(d);
	}
	
	var sizeIds = ids.length;
	//calculates a random number between 1 and sizeWords-1 
	randomNumber = getRandomInt(0,sizeIds-1);
	//get id in that position	
	id = ids[randomNumber];
	
	//get information of the video in json format
	var url = "https://gdata.youtube.com/feeds/api/videos/" + id +"?v=2&alt=json";

	$.when($.getJSON(url, functionWithData)).then(function(){
		//when done, sends message to appScript
		loaded();
	});
}

function onResume(){
	//get start time
	window.startTime = new Date().getTime();

	if(appStopped === 0){
		console.log("LIFECYCLE | onResume of " + document.URL + " is running...");
		console.log("RandomVideo is displaying...");

		console.log("STARRRRRRRRRRRRRRRRRRRRT TIME : " + window.startTime );

		//starts playing random video
		var params = { allowScriptAccess: "always" };
		swfobject.embedSWF("http://www.youtube.com/e/" + id + "?enablejsapi=1&playerapiid=ytplayer?rel=0&autoplay=1", 
			"randomVideo", "600", "240", "9.0.0",null, null, params);
	}
	else{
		console.log("SECONDS ELLAPSED AFTER PAUSE: " + window.secondsEllapsed);
		console.log("VIDEO DURATION: " + window.videoDuration);
		window.videoDuration = window.videoDuration - window.secondsEllapsed;
		console.log("VIDEO DURATION AFTER PAUSE: " + window.videoDuration);
		resume();
	}	
}

function onPauseRequest(){
	var timeAux;

	if(appStopped === 0){
		window.pauseRequestTime = new Date().getTime();
		window.secondsEllapsed = window.pauseRequestTime - window.startTime;
		console.log("LIFECYCLE | onPauseRequest of " + document.URL + " is running...");
		//calculates how many time is needed to finish video
		console.log("Seconds ellapsed: " + window.secondsEllapsed);
		console.log("Video duration: " + window.videoDuration);
		timeAux = window.videoDuration - window.secondsEllapsed;

		console.log("TIME AUX NO PAUSE: " + timeAux);

		//miliseconds -> seconds
		timeAux = timeAux / 1000;
		timeAux = Math.floor(timeAux);
	}
	else{
		console.log("VIDEO DURATION AFTER PAUSE: " + window.videoDuration);
		window.pauseRequestTime = new Date().getTime();
		timeAux = window.videoDuration - window.secondsEllapsed;
		console.log("TIMEAUX AFTER PAUSE: " + timeAux);

		//miliseconds -> seconds
		timeAux = timeAux / 1000;

		timeAux = Math.floor(timeAux);
	}

	//removes remaining seconds of onPause callback
	//timeAux = timeAux - 9;
	
	//if requested time is bigger than 60 seconds
	if(timeAux > 60){
		//ignore request
		return 0;
	}
	else{
		//if is smaller, give requested time to application
		return timeAux;
	}
}

function onPause(callback){
	console.log("LIFECYCLE | onPause of " + document.URL + " is running...");
	appStopped = 1;
	//startTime = 0;

	//pause video
	pause();
	window.pausedTime = new Date().getTime();
	window.secondsEllapsed = window.pausedTime - window.startTime;
	console.log("SECONDS ELLAPSED AFTER PAUSE: " + window.secondsEllapsed);
}

function onUnload(){
	console.log("LIFECYCLE | onUnload of " + document.URL + " is running...");
	appStopped = 0;

	//clear swfobject
	swfobject.removeSWF("randomVideo");
}

function onDestroy(destroyReady){
	console.log("LIFECYCLE | onDestroy of " + document.URL + " is running...");
	destroyReady();
}

