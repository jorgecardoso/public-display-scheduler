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

sendMessageToExtensionScript = function sendMessageToEs(){
	var event = createEventWithState(state);
	var time = timeStamp();
	console.log(time + " | MESSAGES AppScript | >> Sending message <" + event.detail.state + "> to extensionScript of (" + url + ")" );	
	document.dispatchEvent(event); 
}

sendMessageToExtensionScriptExtraTime = function sendMessagetoEsTime(){
	var event = createEventWithStateTime(state,time);
	var timeArrival = timeStamp();
	console.log(timeArrival + " | MESSAGES AppScript | >> Sending message <" + event.detail.state + " , " + time + "> to extensionScript (" + url + ")" );	
	document.dispatchEvent(event); 	
}

function onCreateAux(callback){
	var time = timeStamp();
	console.log(time + " | LIFECYCLE | onCreateAux of " + url + " is running..." );
	state = "created";
	onCreate(callback);
}

function onLoadAux(callback){
	console.log("LIFECYCLE | onLoadAux of " + url + " is running..." );
	state = "loaded";
	onLoad(callback);
}

function onDisplayAux(){
	console.log("LIFECYCLE | onDisplayAux of " + url + " is running...");
	state = "displaying";
	onDisplay();
}

function onHideNotificationAux(callback){
	console.log("LIFECYCLE | onHideNotificationAux " + url + " is running...");
	state = "hideReady";
	onHideNotification(callback);
}

function onHideAux(callback){
	console.log("LIFECYCLE | onHideAux " + url + " is running...");
	state = "not_loaded";
	onHide(callback);
}

//create custom event with argument "state" and "url"
function createEventWithState(state){
  //console.log("appScript is creating an event...");
  var event = new CustomEvent(
    "msgFromAppScript", 
    {
      detail: {
        state: state
      },
    }
  ); 
  return event;
}

function createEventWithStateTime(state,extraTime){
  //console.log("appScript is creating an event...");
  var event = new CustomEvent(
    "msgFromAppScript", 
    {
      detail: {
        state: state,
        time: extraTime
      },
    }
  ); 
  return event;
}

//function to execute after appScript receives a message
function messageReceived(event){
	
	var state = event.data.state;
	var origin = event.origin;
	var originUrl = event.source.url;
	var time = timeStamp();
	
	switch(state){
		case "onLoad":
			console.log(time + " | MESSAGES AppScript | << Receiving message <" + state + "> from extensionScript (" + originUrl + ")");
			onLoadAux(sendMessageToExtensionScript);
			break;
			
		case "onDisplay":
			console.log(time + " | MESSAGES AppScript | << Receiving message <" + state + "> from extensionScript (" + originUrl + ")");
			onDisplayAux();
			break;
			
		case "onHideNotification":
			console.log(time + " | MESSAGES AppScript | << Receiving message <" + state + "> from extensionScript (" + originUrl + ")");
			onHideNotificationAux(sendMessageToExtensionScriptExtraTime);
			break;
			
		case "onHide":
			console.log(time + " | MESSAGES AppScript | << Receiving message <" + state + "> from extensionScript (" + originUrl + ")");
			onHideAux(sendMessageToExtensionScript);
			break;		
	}	
}

var state;
var url;
var time;

//main()
$(document).ready(function() {
	console.log( "appScript.js is running..."); 
	//listen messages from extensionScript.js
	
	window.addEventListener("message", messageReceived);
	url = document.URL;

	//execute onCreate on startup
	onCreateAux(sendMessageToExtensionScript);
});   