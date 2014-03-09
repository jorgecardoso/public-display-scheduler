var title;
var description;
var videoID = [];
var words = ["blue","car","money","sky"];
var id;
var videoDuration;
var secondsEllapsed = 0;


//get a random number betwenn min and max
function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//process received answered from the server
function functionWithData(data) {
	var deferred = $.Deferred();

	var randomIndex = getRandomInt(0,24);
	id = data.feed.entry[randomIndex].media$group.yt$videoid.$t;
	videoDuration = data.feed.entry[randomIndex].media$group.yt$duration.seconds;

	deferred.resolve();
	return deferred.promise();	
};

//auxiliar function to count time on screen
function countingTime(){
	console.log("Counting seconds...");
	secondsEllapsed++;
}

//lifecycle functions
function onCreate(callback){
	console.log("onCreate of RandomVideo is running...");
	
	var sizeWords = words.length;
	//calculates a random number between 1 and sizeWords-1 (0 can never happen!!!!!)
	randomNumber = getRandomInt(0,sizeWords-1);
	//get word in that position	
	word = words[randomNumber];
	
	var url = "http://gdata.youtube.com/feeds/api/videos?q=" + word + "&v=2&alt=json";
	$.when($.getJSON(url, functionWithData)).then(function(){
		//when done, sends message to appScript
		callback();
	});
}

function onLoad(callback){
	swfobject.embedSWF("http://www.youtube.com/e/" + id + "?enablejsapi=1&playerapiid=ytplayer?rel=0&autoplay=1", "randomVideo", "600", "240", "9.0.0");
	callback();
}

function onDisplay(callback){
	console.log("RandomVideo is displaying...");
	//starts auto-play
	callback();
}

function onHideNotification(callback){
	//calculates how many time is needed to finish video
	console.log("Seconds ellapsed: " + secondsEllapsed);
	console.log("Video duration: " + videoDuration);
	timeAux = videoDuration - secondsEllapsed;
	
	if(timeAux > 60000){
		time = 0;
		callback();
	}
	else
		callback();
}

function onHide(callback){
	console.log("onHide of RandomVideo is running...");
	//clear all variables
	callback();
}

//$(document).ready(function() {
function main(){
	console.log("testApps.js of RandomVideo is loaded and running..."); 
  	//listen messages coming from extensionScript.js
  	window.addEventListener("message", messageReceived);
  	
  	//execute onCreate on startup
  	onCreateAux(url,sendMessageToExtensionScript);
};


//global variables
var counter = 0;
var jokes = [];
var i = 0; 
var jokeDuration = 10000;
var showedJokes = 0;
var randomNumber;
var url = "http://localhost/06_02_simpleAppVideo";

$(document).ready(function() {
	main();
});
