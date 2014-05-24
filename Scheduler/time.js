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

//add the time when an application becomes active
function addStartTimeToHash(activeTabId, startTime){
    appsStartime[activeTabId] = startTime;
}

//calculates de airtime of the previous application based on both current and previous application's star time
function addAppAirtime(startTime, activeTabId, previousActiveTabId){

    if(appsStartime[previousActiveTabId] === undefined){
        printRedMsg("APPS","Cannot calculate airtime of the first application running !","");
    }
    else{
        var currentAppStartTime = appsStartime[activeTabId];
        var previousAppStartTime = appsStartime[previousActiveTabId];
        airtime = currentAppStartTime - previousAppStartTime;
        
        addAirtime(previousActiveTabId, airtime);
    }
}

//add application airtime to airtimes hash
function addAirtime(tabId, appAirtime){
    var airtime = [];

    //if there is airtimes defined
    if(applicationsAirtimes[tabId] === undefined){
        airtime.push(appAirtime);
        //add new airtime directly
        applicationsAirtimes[tabId] = airtime;
    }
    else{
        //otherwise, update array of airtimes
        var actualAirtimes = applicationsAirtimes[tabId];
        actualAirtimes.push(appAirtime);
        applicationsAirtimes[tabId] = actualAirtimes;
    }
}

//given an "tabId", returns the airtime of the application opened in that tab
function getAppAirtime(tabId){
    var airtimes = applicationsAirtimes[tabId];

    //if more than one airtime is defined
    if(airtimes.length > 1){
        var sumAirtimes = 0;
        for(var i = 0; i < airtimes.length; i++){
            sumAirtimes = sumAirtimes + airtimes[i];
        }

        //returns the sum of all airtimes
        return sumAirtimes;
    }
    else{
        return airtimes[0];
    }
}