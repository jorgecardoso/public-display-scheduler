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

	callback();
}

function onLoad(callback){
	console.log("LIFECYCLE | onLoad of " + url + " is running...");

	//calculates a random number between 1 and 5
	randomNumber = Math.floor((Math.random()*5)+1);
	console.log("Random number: " + randomNumber);
	
	var url = 'http://api.icndb.com/jokes/random/' + randomNumber;
	//get jokes from server
	($.getJSON(url, functionWithData)).done(function(){
		var sizeJokes = jokes.length;
		//if any error occurs and no jokes are available
		if(sizeJokes === 0){
			console.log("Getting jokes from server again...");
			//try to get jokes from server again
			var url = 'http://api.icndb.com/jokes/random/' + randomNumber;
			$.when($.getJSON(url, functionWithData)).then(function(){
				console.log("Size of jokes: " + sizeJokes);
				//when operation is done, send message to appScript
				callback();
			});
		}
		else{
			//verify if array of jokes have correct data
			callback();
		}		
	});
}

function onResume(){
	console.log("LIFECYCLE | onResume of " + url + " is running...");
	
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
function onPauseRequest(callback){
	console.log("LIFECYCLE | onFinishRequest of " + url + " is running...");
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