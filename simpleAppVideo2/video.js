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
var videoDuration;
var secondsEllapsed = 0;


//get a random number between min and max
function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//process received answered from the server
function functionWithData(data) {
	var deferred = $.Deferred();

	//get video duration in seconds
	videoDuration = data.entry.media$group.yt$duration.seconds;

	deferred.resolve();
	return deferred.promise();	
};

function pause() {
    swfobject.getObjectById('randomVideo').pauseVideo();
}


//auxiliar function to count ellapsed time (visible on console)
function countingTime(){
	console.log("Counting seconds...");
	secondsEllapsed++;
}

//lifecycle functions
function onCreate(callback){
	console.log("LIFECYCLE | onCreate of " + document.URL + " is running...");
	callback();
}

function onLoad(callback){
	console.log("LIFECYCLE | onLoad of " + document.URL + " is running...");
	
	var sizeIds = ids.length;
	//calculates a random number between 1 and sizeWords-1 
	randomNumber = getRandomInt(0,sizeIds-1);
	//get id in that position	
	id = ids[randomNumber];
	
	//get information of the video in json format
	var url = "https://gdata.youtube.com/feeds/api/videos/" + id +"?v=2&alt=json";

	$.when($.getJSON(url, functionWithData)).then(function(){
		//when done, sends message to appScript
		callback();
	});
}

function onResume(){
	console.log("LIFECYCLE | onResume of " + document.URL + " is running...");
	console.log("RandomVideo is displaying...");

	//start counting time
	setInterval(countingTime,1000);

	//starts playing random video
	var params = { allowScriptAccess: "always" };
	swfobject.embedSWF("http://www.youtube.com/e/" + id + "?enablejsapi=1&playerapiid=ytplayer?rel=0&autoplay=1", "randomVideo", "600", "240", "9.0.0",null, null, params);
}

function onPauseRequest(callback){
	console.log("LIFECYCLE | onPauseRequest of " + document.URL + " is running...");
	//calculates how many time is needed to finish video
	console.log("Seconds ellapsed: " + secondsEllapsed);
	console.log("Video duration: " + videoDuration);
	timeAux = videoDuration - secondsEllapsed;

	//removes remaining seconds of onPause callback
	timeAux = timeAux - 9;
	
	//if requested time is bigger than 60 seconds
	if(timeAux > 60000){
		//ignore request
		time = 0;
		callback();
	}
	else{
		//if is smaller, give requested time to application
		time = timeAux;
		callback();
	}
}

function onPause(callback){
	console.log("LIFECYCLE | onPause of " + document.URL + " is running...");

	//pause video
	pause();

	callback();
}

function onUnload(callback){
	console.log("LIFECYCLE | onUnload of " + document.URL + " is running...");
	//clear all variables
	callback();
}

function onDestroy(callback){
	console.log("LIFECYCLE | onDestroy of " + document.URL + " is running...");
	//clear all variables
	callback();
}

