//lifecycle functions
function onCreate(callback){
	console.log("onCreate of ChuckNorrisJokes is running...");
		
	setTimeout(function(){
		callback();
	},3000);
}

function onLoad(callback){
	console.log("onLoad of ChuckNorrisJokes is running...");
	
	setTimeout(function(){
		callback();
	},3000);
}

function onDisplay(callback){
	console.log("ChuckNorrisJokes is displaying...");
	setTimeout(function(){
		callback();
	},3000);
}

//calculates if more time is needed to display all jokes
function onHideNotification(callback){
	setTimeout(function(){
		callback();
	},3000);
}

function onHide(callback){
	console.log("onHide of ChuckNorrisJokes is running...");
	//clear all variables
	callback();
}

function main(){
  	//listen messages coming from extensionScript.js
  	console.log("Listening messages coming from extensionScript...");
  	
	//window.addEventListener("message", messageReceived);
  	
  	//execute onCreate on startup
  	onCreateAux(url,sendMessageToExtensionScript);
};

$(document).ready(function() {
	main();
});