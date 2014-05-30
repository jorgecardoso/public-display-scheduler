var randomNumber;
var videosUrl = [];
var id;
var appStopped = false;
var player;
var playerReady = false;
var onPauseRequestFlag = false;

//load flash player to display videos
function loadPlayer() {
	console.log("loadPlayer");

	// The video to load
	var videoID = "8Vc7aTZkIww"; //"ylLzyHk54Z0"
	// Lets Flash from another domain call JavaScript
	var params = { allowScriptAccess: "always" };
	// The element id of the Flash embed
	var atts = { id: "ytPlayer" };
	// All of the magic handled by SWFObject (http://code.google.com/p/swfobject/)
	swfobject.embedSWF("http://www.youtube.com/v/" + videoID + 
	                   "?version=3&enablejsapi=1&playerapiid=player1", 
	                   "randomVideo", "100%", "100%", "9", null, null, params, atts);
}

//fires when player is ready
function onYouTubePlayerReady(playerId) {
	player = swfobject.getObjectById("ytPlayer");
	playerReady = true;
}

//gets a random number between min and max
function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//executes when receiving answer from server
function videos(data){
	for(var i = 0; i < data.length; i++){
		videosUrl.push(data[i].url);
	}
}

//when player is ready, calls loaded
function checkFlag(loaded) {
    if(playerReady === false) {
    	window.setTimeout(function(){
       	checkFlag(loaded);
       }, 100); 
    } else {
      loaded();
    }
}

//gets a random video from the server's list
function getRandomVideo(loaded){
	var numVideos = videosUrl.length;
	//calculates a random number between 1 and numVideos-1 
	randomNumber = getRandomInt(0, numVideos-1);

	//gets the URL of the video on "randomNumber" position	
	url = videosUrl[randomNumber];
	console.log("Video URL: " + url);

	//gets the ID of the video
	id = url.split("v=")[1];
	console.log("ID of video: " + id);

	checkFlag(loaded);
}

//gets the list of videos from server
function getVideosList(loaded){
	//gets information of the video in json format
	var url = "http://pd-player.appspot.com/getschedule?placeid=videos";

	var ajaxRequest = $.ajax({
	   type: 'GET',
	    url: url,
	    async: false,
	    jsonpCallback: 'videos',
	    dataType: 'jsonp',
	    success: function(json) {
	    	console.log("Everything went well !");
	    },
	    error: function(e) {
	       console.log(e.message);
	    }
	});

	//when list of videos is retrieve from the server, choose a random video
	ajaxRequest.done(function(){
		getRandomVideo(loaded);
	});
}

//listen from state changes on video player
function onytplayerStateChange(newState) {
	
	//if player ends
	if(newState === 0){
		//and onPauseRequest didn't happened yet
		if(onPauseRequestFlag === false){

		//release application after two seconds
		window.setTimeout(function(){
			releaseMe();
			}, 2000);
		}
	}
}

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< LIFECYCLE FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

function onCreate(){
	console.log("LIFECYCLE | onCreate of " + document.URL + " is running...");
	loadPlayer();
}

function onLoad(loaded){

	console.log("LIFECYCLE | onLoad of " + document.URL + " is running...");

	var c = document.getElementById("randomVideo");
	
	//if div "randomVideo" doesn't exist, create it
	if (c === null) {
		var d = document.createElement("div");
		d.setAttribute("id", "randomVideo");
		document.getElementsByTagName('body')[0].appendChild(d);
	}

	getVideosList(loaded);
}

function onResume(){
	if(appStopped === false){
		player.loadVideoById(id);
	}
	else{
		player.playVideo();
	}	
	
	player.addEventListener("onStateChange", "onytplayerStateChange");
}

function onPauseRequest(){

	onPauseRequestFlag = true;

	var videoDuration = player.getDuration();
	console.log("VIDEO DURATION: " + videoDuration);

	var ellapsedTime = player.getCurrentTime();
	console.log("ellapsedTime: " + ellapsedTime);

	var extraTime = videoDuration - ellapsedTime;
	console.log(extraTime);

    return extraTime;
}

function onPause(){
	console.log("LIFECYCLE | onPause of " + document.URL + " is running...");
	appStopped = true;

	//pause video
	player.pauseVideo();

	//remove state change listener
	player.removeEventListener("onStateChange","onytplayerStateChange");
}

function onUnload(created){
	console.log("LIFECYCLE | onUnload of " + document.URL + " is running...");
	appStopped = false;
	onPauseRequestFlag = false;

	created();
}

function onDestroy(destroyReady){
	console.log("LIFECYCLE | onDestroy of " + document.URL + " is running...");
	
	//clear swfobject
	swfobject.removeSWF("randomVideo");

	destroyReady();
}

