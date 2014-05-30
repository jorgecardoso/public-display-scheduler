var videotoplay;
var appPlayer;
var channelKey = "ondemandvideoplayer";
var clientid = Math.floor(Math.random()*10000);	

//flags
var appStopped = false;
var onPauseRequestFlag = false;


function onCreate(){
	
	console.log("Client ID: " + clientid);
	
	myOpenChannel();
}

function onLoad(loaded){

    loaded();
}

function onResume(){
	if(appStopped === false){
 		loadVideo(videotoplay);
	}
	else{
		//resume video
		swfobject.getObjectById("ytPlayer").playVideo();		
	}

	appPlayer = swfobject.getObjectById("ytPlayer");
	
	appPlayer.addEventListener("onStateChange", "onytplayerStateChange");
}

function onPauseRequest(){

	onPauseRequestFlag = true;

	appPlayer = swfobject.getObjectById("ytPlayer");

	var videoDuration = appPlayer.getDuration();
	console.log("VIDEO DURATION: " + videoDuration);

	var ellapsedTime = appPlayer.getCurrentTime();
	console.log("ellapsedTime: " + ellapsedTime);

	var extraTime = videoDuration - ellapsedTime;
	console.log(extraTime);

    return extraTime;
}

function onPause(){
	appStopped = true;

	//pause video
	swfobject.getObjectById("ytPlayer").pauseVideo();

	//remove state change listener
	appPlayer.removeEventListener("onStateChange","onytplayerStateChange");
}

function onUnload(unloadReady){

	appStopped === false;
	onPauseRequestFlag = false;
	
	unloadReady(); 
}

function onDestroy(destroyReady){
 
    destroyReady();
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

function mySendMessage(message) {
   sendMessage(channelKey, document.getElementById('clientidTextbox').value + " " + message);
}

function myOpenChannel() {
	console.log("myOpenChannel...");
	closeChannel();

	var token = localStorage.getItem("token-"+channelKey);
	console.log("Token from localstorage: " + token);
	var tokenTimestamp = localStorage.getItem("timestamp-"+channelKey);
	var age = new Date().getTime() - tokenTimestamp;
	if ( token === null  || typeof(token) === "undefined" || token.length < 1 || age > 20*60*60*1000 ) {
		requestToken(channelKey, tokenReceived);
	} else {
		openChannel(token, onOpened, onMessage, onError, onClose);
	}
}


	function tokenReceived(channelKey, token, tokenAge) {
		tokenTimestamp = new Date().getTime()-tokenAge;

		localStorage.setItem("token-"+channelKey, token);
		localStorage.setItem("timestamp-"+channelKey, tokenTimestamp);
		openChannel(token, onOpened, onMessage, onError, onClose);
	}


	onOpened = function() {
  		console.log("opened");
	};

	onMessage = function (msg) {
		console.log("Received channel message: " + msg.data );
		data = JSON.parse(msg.data);
		videotoplay = data.videoid;

		showMe();
	};

	onError = function() {
		localStorage.setItem("token-"+channelKey, "");
		console.log("Error");
	}

	onClose = function() {
		console.log("Close");
	}