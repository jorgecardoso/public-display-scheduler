//global variables
var counter = 0;
var jokes = [];
var i = 0; 
var jokeDuration = 10000;
var showedJokes = 0;
var randomNumber;
var displayInterval;
var numberOfJokes = 5;
var appStopped = 0; 
var extraTime;

//process data received from the server
function functionWithData(data) {
	if(data === undefined){
		console.log("ERROR | Couldn't get jokes from server !");
		releaseMe();
	}
	else{
		var deferred = $.Deferred();
		//push received jokes to array
		while (counter < randomNumber) {
			console.log("Adding jokes to array...");
	  		jokes.push(data.value[counter].joke);
	  		counter++;
		}	

		deferred.resolve();
		return deferred.promise();
	}
};

function clearBox(elementID)
{
    document.getElementById(elementID).innerHTML = "";
}

//lifecycle functions
function onCreate(){
	console.log(" | LIFECYCLE | onCreate of " + url + " is running...");

	setTimeout(function(){
		showMe();
	},50000);
}

function onLoad(loaded){
	console.log("LIFECYCLE | onLoad of " + url + " is running...");

	//calculates a random number between 1 and "numberOfJokes"
	randomNumber = Math.floor((Math.random()*numberOfJokes)+1);
	console.log("APPS | SimpleJoke | Random number: " + randomNumber);
	
	var url = 'http://api.icndb.com/jokes/random/' + randomNumber;
	
	//get jokes from server
	($.getJSON(url, functionWithData)).done(function(){
		var sizeJokes = jokes.length;
		//if any error occurs and no jokes are available
		if(sizeJokes === 0){
			console.log("Apps | Getting jokes from server again...");

			//try to get jokes from server again
			var url = 'http://api.icndb.com/jokes/random/' + randomNumber;
			$.when($.getJSON(url, functionWithData)).then(function(){
				console.log("Size of jokes: " + sizeJokes);
				//when operation is done, send message to appScript
				loaded();
			});
		}
		else{
			//if everything is okay
			loaded();
		}		
	});
}

function onResume(){
	console.log("LIFECYCLE | onResume of " + url + " is running...");
	
	if(appStopped === 0){
		//add first joke to div
		document.getElementById('randomJoke').innerHTML = jokes[counter-1];

		//and show it
	    $('#randomJoke').css('visibility','visible').hide().fadeIn('slow');

		counter--;
		showedJokes++;
	}
    
    //display remaining jokes one by one every "jokeDuration" seconds
    displayInterval = setInterval(function() {
    	i++;
      	if (i <= randomNumber - 1) {
      		//clear previous joke
      		clearBox('randomJoke');

      		//update box with new joke
      		document.getElementById('randomJoke').innerHTML = jokes[counter-1];

      		//and show it
      		$('#randomJoke').css('visibility','visible').hide().fadeIn('slow');
        	showedJokes++;
        	counter--;
     	}
    }, jokeDuration);
}

//calculates if more time is needed to display all jokes
function onPauseRequest(){
	console.log("LIFECYCLE | onFinishRequest of " + url + " is running...");
	console.log("APPS | SimpleJoke | Showed jokes: " + showedJokes);
	console.log("APPS | SimpleJoke | Random number: " + randomNumber);
	
	if(showedJokes < randomNumber){
		//ask for more time to display all jokes
		console.log("APPS | SimpleJoke | Need more time to display jokes!");
		var remainingJokes = randomNumber - showedJokes;
		console.log("APPS | SimpleJoke | Remaining jokes: " + remainingJokes);
		extraTime = (remainingJokes * jokeDuration)/1000;
		console.log("APPS | SimpleJoke | Give me more: " + extraTime);

		return extraTime;
	}
	else{
		return 0;
	}
}

function onPause(){
	console.log("LIFECYCLE | onPause of " + url + " is running...");

	window.clearInterval(displayInterval);
	appStopped = 1;
}

function onUnload(){
	console.log("LIFECYCLE | onUnload of " + url + " is running...");
	
	//clear div with all jokes
	document.getElementById('randomJoke').innerHTML = "";

	appStopped = 0;
}

function onDestroy(destroyReady){
	console.log("LIFECYCLE | onDestroy of " + url + " is running...");
	destroyReady();
}