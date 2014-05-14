console.log("time.js e running...");

//advanced timer function (used to give more time to applications that requested it)
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

//handles extra time on onPauseRequest callback
giveMeMoreTimeFunc = function moreTimeFunc(extraTime){
    printSimpleMsg("GIVE ME MORE TIME", "Received message asking for more time: ", extraTime);
    //pause current timeout
    printSimpleMsg("GIVE ME MORE TIME", "Pausing current application...","");
    var paused = timerPause.pause();
    
    //if timer is paused            
    if(paused === 1){
        //resume job after extraTime is elapsed
        giveMeMoreTimeTimer = setTimeout(function(){
            timerPause.resume();
            printSimpleMsg("GIVE ME MORE TIME", "Resuming current application...","");
        },extraTime);
    }
}

//returns time in that moment
function getTime(){
    var time = new Date().getTime();
    return time;
}

//returns the airtime of the application corresponding to the "id"
function getAppAirtime(times,id){
    var airtime;

    for(var i = 0; i < times.length; i++){
        var time = times[i];
        if(time[0] === id){
            var nextAppLoadedTime = times[i+1][1];
            airtime = nextAppLoadedTime - times[i][1];
        }
    }

    return airtime;
}

//adds the start time of an application to array "appsAirtime"
function addStartTimeToHash(appId,startTime){   
    var airtimeValue = [];  

    airtimeValue.push(appId);
    airtimeValue.push(startTime);

    for(var i = 0; i < appsAirtime.length; i++){
        if(appsAirtime[i][0] === appId)
            appsAirtime.splice(i, 1);
    }

    appsAirtime.push(airtimeValue);
}