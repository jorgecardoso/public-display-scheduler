console.log("extensionScript.js is running...");

function timeStamp() {
	// Create a date object with the current time
	var now = new Date();

	// Create an array with the current hour, minute and second
	var time = [ now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds() ];

	// Convert hour from military time
	time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;

	// If hour is 0, set it to 12
	time[0] = time[0] || 12;

	// If seconds and minutes are less than 10, add a zero
	for ( var i = 1; i < 3; i++ ) {
		if ( time[i] < 10 ) {
			time[i] = "0" + time[i];
		}
	}

	// Return the formatted string
	return  time.join(":");
}

var time = timeStamp();
console.log("TIME:" + time);

//listen for showMe message from application
document.addEventListener('showMe',function(source){
	console.log(time + " | MESSAGES ExtensionScript | << Receiving message showMe from appScript of ");
	chrome.extension.sendMessage({state : "showMe"});
})

//listen for messages coming from appScript.js  
document.addEventListener('msgFromAppScript', function(data,source) {
	var state = data.detail.state;

	if(state === "pauseReady"){
		var time = timeStamp();
		console.log(time + " | MESSAGES ExtensionScript | << Receiving message <" + state + " , " + data.detail.time + "> from appScript of ");
	}
	else{
		var time = timeStamp();
		console.log(time + " | MESSAGES ExtensionScript | << Receiving message <" + state + "> from appScript of ");
	}


	switch(state){
		case "created":
			var time = timeStamp();
			console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + "> to Extension");
	      	chrome.extension.sendMessage({state : state});
		break;

		case "createdFromAppScript":
			var time = timeStamp();
			console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + "> to Extension");
			//reload application's page
	      	chrome.extension.sendMessage({state : state});
		break;

		case "loaded":
			var time = timeStamp();
			console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + "> to Extension");
	      	chrome.extension.sendMessage({state : state});
		break;

		case "pauseReady":
			var time = timeStamp();
			console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + " , " + data.detail.time + "> to Extension");
	      	chrome.extension.sendMessage({state : state, time: data.detail.time});
		break;

		case "paused":
			var time = timeStamp();
			console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + "> to Extension");
	      	chrome.extension.sendMessage({state : state, time: data.detail.time});
		break;

		case "createdFromAppScript":
			var time = timeStamp();
			console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + "> to Extension");
	      	chrome.extension.sendMessage({state : state});
		break;
	}
});

//listen for messages coming from extension
chrome.runtime.onMessage.addListener(
	function(message, sender) {

		var state = message.state;
		var url = message.url;
		var time = timeStamp();

		console.log(time + " | MESSAGES ExtensionScript | << Receiving message <" + state + "> from Extension");

		switch(state){
			case "onCreate":
				var time = timeStamp();
				console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + " to appScript " + "(" + url + ")");
       			window.postMessage({state: message.state}, url);
			break;

			case "onLoad":
				var time = timeStamp();
				console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + " to appScript " + "(" + url + ")");
       			window.postMessage({state: message.state}, url);
			break;

			case "onResume":
				var time = timeStamp();
				console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + "> to appScript " + "(" + url + ")");
       			window.postMessage({state: message.state}, url);
			break;

			case "onPauseRequest":
				var time = timeStamp();
				console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + "> to appScript " + "(" + url + ")");
       			window.postMessage({state: message.state}, url);
			break;

			case "onPause":
				var time = timeStamp();
				console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + "> to appScript " + "(" + url + ")");
       			window.postMessage({state: message.state}, url);	
			break;

			case "onUnload":
				var time = timeStamp();
				console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + "> to appScript " + "(" + url + ")");
       			window.postMessage({state: message.state}, url);	
			break;
		}
	}
);