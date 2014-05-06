var videotoplay;
var channelKey = "ondemandvideoplayer";
var clientid = Math.floor(Math.random()*10000);	


function onCreate(){
	
	console.log("Client ID: " + clientid);
	
	myOpenChannel();

}

function onLoad(loaded){

    loaded();
}

function onResume(){
 	loadVideo(videotoplay);
}

function onPauseRequest(){
    return 0;
}

function onPause(){

}

function onUnload(unloadReady){
   
}

function onDestroy(destroyReady){
 
    destroyReady();
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