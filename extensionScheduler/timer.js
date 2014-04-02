console.log("timer.js e running...");

//advanced timer function
function Timer(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
        return 1;
    };

    this.resume = function() {
        start = new Date();
        timerId = window.setTimeout(callback, remaining);
    };

    this.removeTimer = function(){
    	window.clearTimeout(timerId);
    }

    this.resume();
}

//auxiliar function to count time on screen
function countingTime(){
	console.log("Counting seconds...");
	//secondsEllapsed++;
}

//var t=setInterval(countingTime,1000);