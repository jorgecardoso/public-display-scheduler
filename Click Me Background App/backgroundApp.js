//global variables
var counter = 0;
var jokes = [];
var i = 0; 
var jokeDuration = 10000;
var showedJokes = 0;
var randomNumber;

function showMeTimeout(){

	setTimeout(function(){
		showMe();
	},10000);
}

//showMeTimeout();

//lifecycle functions
function onCreate(){
	console.log(" | LIFECYCLE | onCreate of " + url + " is running...");
}

function onLoad(loaded){
	console.log("LIFECYCLE | onLoad of " + url + " is running...");
	setTimeout(function(){
		loaded();
	},3000);
}

function onResume(){
	console.log("LIFECYCLE | onResume of " + url + " is running...");
}

function onPauseRequest(){
	console.log("LIFECYCLE | onFinishRequest of " + url + " is running...");
}

function onPause(){
	console.log("LIFECYCLE | onPause of " + url + " is running...");
}

function onUnload(){
	console.log("LIFECYCLE | onUnload of " + url + " is running...");
}

function onDestroy(destroyReady){
	console.log("LIFECYCLE | onDestroy of " + url + " is running...");
	destroyReady();
}