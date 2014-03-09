var state;
var url;
var time;
var idTab;

sendMessageToExtensionScript = function sendMessageToEs(){
	var event = createEventWithState(state,url);
	console.log("MESSAGES AppScript | Sending to extensionScript | Message: " + event.detail.state + " + " + event.detail.tabUrl);	
	document.dispatchEvent(event); 
}

sendMessageToExtensionScriptExtraTime = function sendMessagetoEsTime(){
	var event = createEventWithStateTime(state,url,time);
	console.log("MESSAGES AppScript | Sending to extensionScript | Message: " + event.detail.state + " + " + event.detail.tabUrl + " + " + time + " seconds");	
	document.dispatchEvent(event); 	
}

function onCreateAux(tabURL, callback){
	console.log("28_01 onCreateAux is running...");
	state = "created";
	url = tabURL;
	onCreate(callback);
}

function onLoadAux(tabURL, callback){
	console.log("28_01 onLoadAux is running...");
	state = "loaded";
	url = tabURL;
	onLoad(callback);
}

function onDisplayAux(tabURL, callback){
	console.log("28_01 onDisplayAux is running...");
	state = "displaying";
	url = tabURL; 
	onDisplay(callback);
}

function onHideNotificationAux(tabURL, callback){
	console.log("28_01 onHideNotificationAux is running...");
	state = "hideReady";
	url = tabURL;
	onHideNotification(callback);
}

function onHideAux(tabURL, callback){
	console.log("28_01 onHideAux is running...");
	state = "not_loaded";
	url = tabURL;
	onHide(callback);
}

//create custom event with argument "state" and "url"
function createEventWithState(state,tabURL){
  //console.log("appScript is creating an event...");
  var event = new CustomEvent(
    "newMessage", 
    {
      detail: {
        state: state,
        tabUrl: tabURL
      },
      bubbles: true,
      cancelable: true
    }
  ); 
  return event;
}

function createEventWithStateTime(state,tabURL,extraTime){
  //console.log("appScript is creating an event...");
  var event = new CustomEvent(
    "newMessage", 
    {
      detail: {
        state: state,
        tabUrl: tabURL,
        time: extraTime
      },
      bubbles: true,
      cancelable: true
    }
  ); 
  return event;
}

//function to execute after appScript receives a message
function messageReceived(event){
	
	var state = event.data.state;
	
	switch(state){
		case "onLoad":
			console.log("MESSAGES AppScript | Received from extensionScript | Message: " + event.data.state + " + " + event.data.url + " + " + event.data.id);
			idTab = event.data.id;
			onLoadAux(event.data.url,sendMessageToExtensionScript);
			break;
			
		case "onDisplay":
			console.log("MESSAGES AppScript | Received from extensionScript | Message: " + event.data.state + " + " + event.data.url);
			onDisplayAux(event.data.url,sendMessageToExtensionScript);
			break;
			
		case "onHideNotification":
			console.log("MESSAGES AppScript | Received from extensionScript | Message: " + event.data.state + " + " + event.data.url);
			onHideNotificationAux(event.data.url,sendMessageToExtensionScriptExtraTime);
			break;
			
		case "onHide":
			console.log("MESSAGES AppScript | Received from extensionScript | Message: " + event.data.state + " + " + event.data.url);
			onHideAux(event.data.url,sendMessageToExtensionScript);
			break;		
	}	
}

//main()
$(document).ready(function() {
  console.log( "appScript.js is running..." ); 
  //listen messages from extensionScript.js
  window.addEventListener("message", messageReceived);
 

  //onCreate();
  //onCreateAux();


});   