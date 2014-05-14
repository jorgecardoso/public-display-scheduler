console.log("extensionScript.js is running...");

//listen for showMe message from application
document.addEventListener('showMe', function(source){
	printRedMsg("SHOW ME", "Receiving message SHOW ME from application", source.target.URL);
	chrome.extension.sendMessage({state : "showMe"});
})

document.addEventListener('releaseMe', function(source){
	printRedMsg("RELEASE ME", "Receiving message RELEASE ME from application", source.target.URL);
	chrome.extension.sendMessage({state : "releaseMe"});
})

//listen for messages coming from appScript.js  
document.addEventListener('msgFromAppScript', function(data) {
	var state = data.detail.state;
	var url = data.target.URL;

	if(state === "pauseReady"){
		printCommunicationMsg("extensionScript", "<< Receiving",  [url, state, data.detail.time]);
	}
	else{
		printCommunicationMsg("extensionScript", "<< Receiving", [url, state, ""]);
	}


	switch(state){
		case "created":
			printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
	      	chrome.extension.sendMessage({state : state});
		break;

		case "loaded":
			printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
	      	chrome.extension.sendMessage({state : state});
		break;

		case "pauseReady":
			printCommunicationMsg("extensionScript", ">> Sending", [url, state, data.detail.time]);
	      	chrome.extension.sendMessage({state : state, time: data.detail.time});
		break;

		case "paused":
			printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
	      	chrome.extension.sendMessage({state : state});
		break;

		case "createdAfterUnload":
			printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
	      	chrome.extension.sendMessage({state : state});		
		break;

		case "destroyReady":
			printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
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

		printCommunicationMsg("extensionScript", "<< Receiving", [url, state, ""]);

		switch(state){
			case "onCreate":
				printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
       			window.postMessage({state: message.state}, url);
			break;

			case "onLoad":
				printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
       			window.postMessage({state: message.state}, url);
			break;

			case "onResume":
				printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
       			window.postMessage({state: message.state}, url);
			break;

			case "onPauseRequest":
				printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
       			window.postMessage({state: message.state}, url);
			break;

			case "onPause":
				printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
       			window.postMessage({state: message.state}, url);	
			break;

			case "onUnload":
				printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
       			window.postMessage({state: message.state}, url);	
			break;

			case "onDestroy":
				printCommunicationMsg("extensionScript", ">> Sending", [url, state, ""]);
       			window.postMessage({state: message.state}, url);
			break;
		}
	}
);

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< AUXILIAR FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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

//prints a simple message in the console
function printSimpleMsg(type, message, arg){
	var time = timeStamp();
	console.log("%s | %s | %s %s", time, type, message, arg);
}

//prints a blue message in the console (used to print message communication logs)
function printCommunicationMsg(from, message, arg){
	var time = timeStamp();
	console.log("%c%s | COMMUNICATION %s | %s %s < %s %s>", "color: blue ", time, from, arg[0], message, arg[1], arg[2]);
}

//prints a red message in the console
function printRedMsg(type, message, arg){
	var time = timeStamp();
	console.log("%c%s | %s | %s %s", "color: red", time, type, message, arg);
}