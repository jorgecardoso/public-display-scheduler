console.log("appScript !");
var state;
var url;
var time;

//listen messages from extensionScript.js
window.addEventListener("message", messageReceived);
url = document.URL; 

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< LIFECYCLE AUXILIAR FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

function onCreateAux(created){
	printSimpleMsg("LIFECYCLE", "onCreateAux", url);
	state = "created";
	
	try{
		onCreate();
		created();
	}
	catch(err){
		printRedMsg("ERROR", err, "onCreate is not defined");
		console.log(err);
		created();
	}
}

function onLoadAux(loaded){
	printSimpleMsg("LIFECYCLE", "onLoadAux", url);
	state = "loaded";
	
	try{
		onLoad(loaded);
	}
	catch(err){
		printRedMsg("ERROR", err, "onLoad is not defined");
		console.log(err);
		loaded();
	}
}

function onResumeAux(){
	printSimpleMsg("LIFECYCLE", "onResumeAux", url);
	
	try{
		onResume();
	}
	catch(err){
		printRedMsg("ERROR", err, "onResume is not defined");
		console.log(err);	
	}
}

function onPauseRequestAux(pauseReady){
	printSimpleMsg("LIFECYCLE", "onPauseRequestAux", url);
	state = "pauseReady";
	
	try{
		time = onPauseRequest();
		
		if(time === undefined){
			console.warn("onPauseRequest should return a value !");
		}

		pauseReady();
	}
	catch(err){
		printRedMsg("ERROR", err, "onPauseRequest is not defined");
		console.log(err);
		time = 0;
		pauseReady();
	}
}

function onPauseAux(paused){
	printSimpleMsg("LIFECYCLE", "onPauseAux", url);
	state = "paused";
	
	try{
		onPause();
		paused();
	}
	catch(err){
		printRedMsg("ERROR", err, "onPause is not defined");
		console.log(err);
		paused();
	}
}

function onUnloadAux(created){
	printSimpleMsg("LIFECYCLE", "onUnloadAux", url);
	state = "createdAfterUnload";
	
	try{
		onUnload(created);
	}
	catch(err){
		printRedMsg("ERROR", err, "onUnload is not defined");
		console.log(err);
		created();		
	}
}

function onDestroyAux(destroyReady){
	printSimpleMsg("LIFECYCLE", "onDestroyAux", url);
	state = "destroyReady";
	
	try{
		onDestroy(destroyReady);
	}catch(err){
		printRedMsg("ERROR", err, "onDestroy is not defined");	
		console.log(err);
		destroyReady();
	}
}

function showMe(){
	var showMeEvt = new CustomEvent('showMe');
	document.dispatchEvent(showMeEvt);
}

function releaseMe(){
	var releaseMeEvt = new CustomEvent('releaseMe');
	document.dispatchEvent(releaseMeEvt);
}

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< COMMUNICATION >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

//from extensionScript to application
function messageReceived(event){
	
	var state = event.data.state;
	var origin = event.origin;
	var originUrl = event.source.url;

  if (event.source != window)
  return;

  if (event.data.source && (event.data.source == "MyExtension")) {	
  	switch(state){
  		case "onCreate":
  			printCommunicationMsg("appScript", "<< Receiving", [originUrl, state, ""]);
  			onCreateAux(sendMessageToExtensionScript);
  			break;

  		case "onLoad":
  			printCommunicationMsg("appScript", "<< Receiving", [originUrl, state, ""]);
  			onLoadAux(sendMessageToExtensionScript);
  			break;
  			
  		case "onResume":
  			printCommunicationMsg("appScript", "<< Receiving", [originUrl, state, ""]);
  			onResumeAux();
  			break;
  			
  		case "onPauseRequest":
  			printCommunicationMsg("appScript", "<< Receiving", [originUrl, state, ""]);
  			onPauseRequestAux(sendMessageToExtensionScriptExtraTime);
  			break;
  			
  		case "onPause":
  			printCommunicationMsg("appScript", "<< Receiving", [originUrl, state, ""]);
  			onPauseAux(sendMessageToExtensionScript);
  			break;

  		case "onUnload":
  			printCommunicationMsg("appScript", "<< Receiving", [originUrl, state, ""]);
  			onUnloadAux(sendMessageToExtensionScript);
  			break;	

  		case "onDestroy":
  			printCommunicationMsg("appScript", "<< Receiving", [originUrl, state, ""]);
  			onDestroyAux(sendMessageToExtensionScript);
  			break;		
  	}	
  }
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

//sending messages from appScript (application) to extensionScript
sendMessageToExtensionScript = function sendMessageToEs(){
	var event = createEventWithState(state);
	printCommunicationMsg("appScript", ">> Sending", [url, event.detail.state, ""]);
	document.dispatchEvent(event); 
}

sendMessageToExtensionScriptExtraTime = function sendMessagetoEsTime(){
	var event = createEventWithStateTime(state,time);
	printCommunicationMsg("appScript", ">> Sending", [url, event.detail.state, time]);
	document.dispatchEvent(event); 	
}

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< AUXILIAR FUNCTIONS >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 

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

function printSimpleMsg(type, state, url){
	var time = timeStamp();
	console.log("%s | %s | %s of %s is running...", time, type, state, url);
}

function printCommunicationMsg(from, message, arg){
	var time = timeStamp();
	console.log("%c%s | COMMUNICATION %s | %s %s < %s %s>", "color: green ", time, from, arg[0], message, arg[1], arg[2]);
}

function printRedMsg(type, message, arg){
	var time = timeStamp();
	console.log("%c%s | %s | %s %s", "color: red", time, type, message, arg);
}
