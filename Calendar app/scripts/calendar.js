var calendarUrl = "https://www.google.com/calendar/feeds/sue43d0qaup3vfokqn268b6s8k%40group.calendar.google.com/public/basic";
var events = [];
var eventsInterval;
var calendarInterval;
var minutesToEvent = 10;
var checkEventsInterval = 10000;
var checkCalendarInterval = 3600000;
var nextEvent;

function onCreate(){
    //get current information of all events in calendar
    getEventInformation();

    //start checking every "checkInterval" seconds if any event is close to starting
    eventsInterval = window.setInterval(checkEventTimes, checkEventsInterval);

    //checks for events calendars updates every "checkCalendarInterval" seconds
    calendarInterval = window.setInterval(getEventInformation, checkCalendarInterval);
}

function onLoad(loaded){
    var nextEventTime = nextEvent[0];
    var nextEventHours = nextEventTime.get('hour');
    var nextEventMinutes = nextEventTime.get('minute');
    var eventTime = nextEventHours.toString().concat(":");
    var finalEventTime = eventTime.concat(nextEventMinutes.toString());

    var nextEventLocation = nextEvent[1];
    var nextEventDescription = nextEvent[2];

    document.getElementById("eventTime").innerHTML= finalEventTime;
    document.getElementById("eventLocation").innerHTML= nextEventLocation;
    document.getElementById("eventDescription").innerHTML= nextEventDescription;

    loaded();
}

function onResume(){
    //change div colour
    setTimeout(function(){
        document.getElementById("eventTime").style.backgroundColor = 'green';
        document.getElementById("eventLocation").style.backgroundColor = 'red';
        document.getElementById("eventDescription").style.backgroundColor = 'blue';
    }, 4000);
}

function onPauseRequest(){
    return 0;
}

function onPause(){

}

function onUnload(){
    //clean template data
    document.getElementById("eventTime").innerHTML= '';
    document.getElementById("eventLocation").innerHTML= '';
    document.getElementById("eventDescription").innerHTML= '';
}

function onDestroy(destroyReady){
    window.clearInterval(eventsInterval);
    window.clearInterval(calendarInterval);
    destroyReady();
}

function getEventInformation(){
    $.ajax({
        type: "GET",
        url: calendarUrl,
        dataType: "jsonp",
        success: function(xml){
            $(xml).find('entry').each(function(){
                var entryContent = $(this).find('content').text();
                var entrySummary = $(this).find('summary').text();
                var splitedContent = entryContent.split("<br />");
                var splitedSummary = entrySummary.split("&nbsp;");

                var eventInfo = parseResult(splitedSummary, splitedContent);
                console.log("EVENT INFO: " + eventInfo);

                var eventTime;

                if(eventInfo[0].slice(-2) === "am"){
                    eventTime = moment(eventInfo[0], "ddd MMM D, yyyy h:mma");
                }
                
                if(eventInfo[0].slice(-2) === "pm"){
                    eventTime = moment(eventInfo[0], "ddd MMM D, yyyy h:mmA");
                }

                var currentTime = moment();
                var oldEvent = currentTime.isAfter(eventTime);

                if(oldEvent === false){
                    //update start time with start time in "moment" format
                    eventInfo.shift();
                    eventInfo.unshift(eventTime);

                    //push event to array of events
                    events.push(eventInfo);
                }
                else{
                    console.log("IGNORING EVENT " + eventInfo);
                }
            });
        },
        error: function() {
            alert("An error occurred while processing XML file.");
        }
    });
}

function parseResult(resultSummary, resultContent){
    var parsedResult = [];

    var when = resultSummary[0].substring(6);
    var when2 = when.replace(",","");
    var when22 = when2.split("to");
    var when3 = when.split(" ");

    var startTime = when3[4];
    var timePeriodStart = startTime.slice(-2);
    var endTime = when22[1];
    var timePeriodEnd = endTime.slice(-2);

    if(startTime.indexOf(":") === -1){
        console.log("HERE!");
        startTimeFinal = startTime.split(timePeriodStart);
        startTimeFinal = startTimeFinal[0].concat(":00");
        startTimeFinal = startTimeFinal.concat(timePeriodStart);

        var finalWhen = when22[0].replace(startTime,startTimeFinal);
        finalWhen = finalWhen.substring(0,finalWhen.length - 1);
        parsedResult.push(finalWhen);
    }
    else{
        var finalWhen = when22[0].substring(0,when22[0].length - 1);
        parsedResult.push(finalWhen);
    }

    if(endTime.indexOf(":") === -1){
        endTimeFinal = endTime.split(timePeriodEnd);
        endTimeFinal = endTimeFinal[0].concat(":00");
        endTimeFinal = endTimeFinal.concat(timePeriodEnd);
    }
 
    var where = resultContent[2].substring(7);
    var whereFinal = where.slice(0,-1);
    var description = resultContent[4].substring(19);

    parsedResult.push(whereFinal);
    parsedResult.push(description);

    return parsedResult;
} 

function checkEventTimes(){
    for(var i = 0; i < events.length; i++){
        var currentTime  = moment();
        var diff = events[i][0].diff(currentTime, 'minutes');

        if(diff <= minutesToEvent){
            nextEvent = events[i];
            //remove event from array of events
            events.splice(i, 1);
            console.log("PRITING EVENTS!!!!");
            for(var i = 0; i < events.length; i++){
                console.log(events[i]);
            }
            //call showMe in order to ask for airtime
            showMe();
        }
    }
}