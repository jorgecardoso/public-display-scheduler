console.log("extensionScript is running...");

//listen for messages coming from appScript.js	
document.addEventListener('newMessage', function(data) {
	console.log("MESSAGES ExtensionScript | << Receiving from appScript | Message: " + data.detail.state + " + " + data.detail.tabUrl);
	
	var state = data.detail.state;
	
	switch(state){
		case "created":
			chrome.extension.sendMessage({state : data.detail.state, url: data.detail.tabUrl});
    		console.log("MESSAGES ExtensionScript | >> Sending to Extension | Message: " + data.detail.state + " + " + data.detail.tabUrl);
    		break;
    	case "loaded":
    		chrome.extension.sendMessage({state : data.detail.state, url: data.detail.tabUrl});
    		console.log("MESSAGES ExtensionScript | >> Sending to Extension | Message: " + data.detail.state + " + " + data.detail.tabUrl);
    		break;
    	case "displaying":
    		chrome.extension.sendMessage({state : data.detail.state, url: data.detail.tabUrl});
    		console.log("MESSAGES ExtensionScript | >> Sending to Extension | Message: " + data.detail.state + " + " + data.detail.tabUrl);
    		break;  
    	case "hideReady":
    		chrome.extension.sendMessage({state : data.detail.state, url: data.detail.tabUrl, time: data.detail.time});
    		console.log("MESSAGES ExtensionScript | >> Sending to Extension | Message: " + data.detail.state + " + " + data.detail.tabUrl + " + " + data.detail.time + " seconds");
    		break;
    	case "not_loaded":
    		chrome.extension.sendMessage({state : data.detail.state, url: data.detail.tabUrl, time: data.detail.time});
    		console.log("MESSAGES ExtensionScript | >> Sending to Extension | Message: " + data.detail.state + " + " + data.detail.tabUrl + " + " + data.detail.time + " seconds");  		
			break;
	}
});


//listen for messages coming from extension
chrome.runtime.onMessage.addListener(
  function(message, sender) {
    console.log("MESSAGES ExtensionScript | << Receiving from Extension | Message: " + message.state + " + " + message.url);
    
    var state = message.state;
    
     switch(state){
     	case "onCreate":
     		window.postMessage({message_script: message.state}, message.url);
			console.log("MESSAGES ExtensionScrip | >> Sending to appScript | Message: " + message.state + " to URL: " + message.url);
			break;
	case "onLoad":
		    window.postMessage({state: message.state, url: message.url}, message.url);
			console.log("MESSAGES ExtensionScript | >> Sending to appScript | Message: " + message.state + " to URL: " + message.url);
			break;
	case "onDisplay":
			window.postMessage({state: message.state, url: message.url}, message.url);
			console.log("MESSAGES ExtensionScript | >> Sending to appScript | Message: " + message.state + " to URL: " + message.url);
			break;
	case "onHideNotification":
			window.postMessage({state: message.state, url: message.url}, message.url);
			console.log("MESSAGES ExtensionScript | >> Sending to appScript | Message: " + message.state + " to URL: " + message.url);
			break;
	case "onHide":
			window.postMessage({state: message.state, url: message.url}, message.url);
			console.log("MESSAGES ExtensionScript | >> Sending to appScript | Message: " + message.state + " to URL: " + message.url);
			break;
     }
});