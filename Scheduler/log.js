console.log("log.js is running...");

//prints text followed by all elements of "array" 
function printArray(array, text){
	var time = timeStamp();
	console.log("%s | SCHEDULE  | %s", time, text);
	for(var i = 0; i < array.length; i++){
		console.log(array[i]);
	}
}

//prints a simple message in the console
function printSimpleMsg(type, message, arg){
	var time = timeStamp();
	console.log("%s | %s | %s %s", time, type, message, arg);
}

//prints a blue message in the console (used to print message communication logs)
function printCommunicationMsg(from, message, arg){
	var time = timeStamp();
	console.log("%c%s | COMMUNICATION %s | %s %s < %s %s>", "color: blue ", time, from, arg[0], message, arg[1], arg[2]);
}

//prints a red message in the console
function printRedMsg(type, message, arg){
	var time = timeStamp();
	console.log("%c%s | %s | %s %s", "color: red", time, type, message, arg);
}

//prints a green message in the console (used to print storage logs)
function printGreenMsg(type, message, arg){
	var time = timeStamp();
	console.log("%c%s | %s | %s %s", "color: green", time, type, message, arg);
}

//returns the current time
function timeStamp() {
	// Create a date object with the current time
	var now = new Date();

	// Create an array with the current hour, minute and second
	var time = [ now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds() ];

	// Convert hour from military time
	time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;

	// If hour is 0, set it to 12
	time[0] = time[0] || 12;

	// If seconds and minutes are less than 10, add a zero
	for ( var i = 1; i < 3; i++ ) {
		if ( time[i] < 10 ) {
			time[i] = "0" + time[i];
		}
	}

	// Return the formatted string
	return  time.join(":");
}