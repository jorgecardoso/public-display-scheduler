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
	console.log("onCreate of ChuckNorrisJokes is running...");
		
	//calculates a random number between 1 and 5
	randomNumber = Math.floor((Math.random()*5)+1);
	console.log("Random number: " + randomNumber);
	
	var url = 'http://api.icndb.com/jokes/random/' + randomNumber;
	//get jokes from server
	$.when($.getJSON(url, functionWithData)).then(function(){
		//when done, sends message to appScript
		callback();
	});
}

function onLoad(callback){
	console.log("onLoad of ChuckNorrisJokes is running...");
	
	var sizeJokes = jokes.length;
	console.log("Size of jokes: " + sizeJokes);
	
	if(sizeJokes === 0){
		console.log("Getting jokes from server again...");
		//something went wrong, get jokes from server again
		var url = 'http://api.icndb.com/jokes/random/' + randomNumber;
		$.when($.getJSON(url, functionWithData)).then(function(){
			console.log("Size of jokes: " + sizeJokes);
			//when operation is done, send message to appScript
			callback();
		});
	}
	else{
		//verifying if array of jokes have correct data
		for(var i = 0; i < jokes.length; i++){
			if(jokes[i] === "undefined"){
				//something wrong happened, try to get new jokes
				console.log("Something went wrong! ");
			}
			
			else{
				console.log("Everything went well!");
			}
		}

		callback();	
	}
}

function onDisplay(callback){
	console.log("ChuckNorrisJokes is displaying...");
	callback();
	
	$('#randomJoke').append(jokes[counter - 1] + "</br>");
	counter--;
	showedJokes++;
    
    //display jokes one by one every "jokeDuration" seconds
    var displayInterval = setInterval(function() {
    	i++;
      	if (i <= randomNumber - 1) {
        	$('#randomJoke').append(jokes[counter - 1] + "</br>");
        	showedJokes++;
        	counter--;
     	}
    }, jokeDuration);
}

//calculates if more time is needed to display all jokes
function onHideNotification(callback){
	console.log("onHideNotification of ChuckNorrisJokes is running...");
	console.log("Showed jokes: " + showedJokes);
	console.log("Random number: " + randomNumber);
	
	if(showedJokes < randomNumber){
		//ask for more time to display all jokes
		console.log("Need more time to display jokes!");
		var remainingJokes = randomNumber - showedJokes;
		console.log("Remaining jokes: " + remainingJokes);
		time = (remainingJokes * jokeDuration)/1000;
		time = time - 10000;
		console.log("time: " + time);
		callback();
	}
	else{
		time = 0;
		callback();
	}
}

function onHide(callback){
	console.log("onHide of ChuckNorrisJokes is running...");
	//clear all variables
	callback();
}

function main(){
  	//listen messages coming from extensionScript.js
  	console.log("Listening messages coming from extensionScript...");
  	window.addEventListener("message", messageReceived);
  	
  	//execute onCreate on startup
  	onCreateAux(url,sendMessageToExtensionScript);
};


//global variables
var counter = 0;
var jokes = [];
var i = 0; 
var jokeDuration = 10000;
var showedJokes = 0;
var randomNumber;
var url = "http://localhost/20_02_simpleAppJoke";

$(document).ready(function() {
	main();
});