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
}

function onDisplay(){
	console.log("LIFECYCLE | onDisplay of " + url + " is running...");
	setTimeout(function(){
			document.getElementById("displayText").value='HEY!';
	},3000);
}

//calculates if more time is needed to display all jokes
function onHideNotification(callback){
	console.log("LIFECYCLE | onHideNotification of " + url + " is running...");

	time = 0;

	setTimeout(function(){
		callback();
	},3000);
}

function onHide(callback){
	console.log("LIFECYCLE | onHide of " + url + " is running...");
	//clear all variables
	callback();
}