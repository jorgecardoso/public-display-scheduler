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

function pause() {
    swfobject.getObjectById('randomVideo').pauseVideo();
}


//auxiliar function to count time on screen
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

function onResume(){
	console.log("LIFECYCLE | onResume of " + document.URL + " is running...");
	console.log("RandomVideo is displaying...");
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
	
	if(timeAux > 60000){
		time = 0;
		callback();
	}
	else
		callback();
}

function onPause(callback){
	console.log("LIFECYCLE | onPause of " + document.URL + " is running...");
	//clear all variables

	//pause video
	pause();

	setTimeout(function(){
		callback();
	},5000);
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

