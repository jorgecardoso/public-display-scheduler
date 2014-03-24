//global variables
var counter = 0;
var jokes = [];
var i = 0; 
var jokeDuration = 10000;
var showedJokes = 0;
var randomNumber;

//process data received from the server
function functionWithData(data) {
	var deferred = $.Deferred();
	//push jokes to array
	while (counter < randomNumber) {
		console.log("Adding jokes to array...");
  		jokes.push(data.value[counter].joke);
  		counter++;
	}	

	deferred.resolve();
	return deferred.promise();
};

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
		showMe();
	},10000);
}

function onResume(){
	console.log("LIFECYCLE | onResume of " + url + " is running...");
}

//calculates if more time is needed to display all jokes
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

function onUnload(callback){
	console.log("LIFECYCLE | onUnload of " + url + " is running...");
	//clear all variables
	setTimeout(function(){
		callback();
	},3000);

	//saves jokes obtained from the server to use if anything goes wrong next time

	//callback();
}

function onDestroy(callback){
	console.log("LIFECYCLE | onDestroy of " + url + " is running...");
	//clear all variables
	callback();
}