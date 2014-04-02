//global variables
var counter = 0;
var jokes = [];
var i = 0; 
var jokeDuration = 10000;
var showedJokes = 0;
var randomNumber;

//lifecycle functions
function onCreate(callback){
	var time = timeStamp();
	console.log(time + " | LIFECYCLE | onCreate of " + url + " is running...");
	setTimeout(function(){
		callback();
	},3000);
}

function onLoad(callback){
	console.log("LIFECYCLE | onLoad of " + url + " is running...");
	setTimeout(function(){
		callback();
	},3000);

	setTimeout(function(){
		//showMe();
	},10000);
}

function onResume(){
	console.log("LIFECYCLE | onResume of " + url + " is running...");
}

function onPauseRequest(callback){
	console.log("LIFECYCLE | onFinishRequest of " + url + " is running...");
	callback();
}

function onPause(callback){
	console.log("LIFECYCLE | onPause of " + url + " is running...");
	//clear all variables

	setTimeout(function(){
		callback();
	},3000);
}

function onUnload(){
	console.log("LIFECYCLE | onUnload of " + url + " is running...");
}

function onDestroy(callback){
	console.log("LIFECYCLE | onDestroy of " + url + " is running...");

	callback();
}