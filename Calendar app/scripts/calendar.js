var calendarId;
var calendarUrl; 
var events = [];
var eventsInterval;
var calendarInterval;
var nextEvent;

//application will be lauched if any event start time - current time is less then "minutesToEvent"
var minutesToEvent;

var defaultValueMTE = 75;
var checkEventsInterval = 10000;
var checkCalendarInterval = 3600000;

function onCreate(){
    //get all parameters of URL
    var urlParameters = getUrlParams(document.location.search);

    //get calendar ID
    calendarId = urlParameters.id;

    //get value of "minutes to event" call
    minutesToEvent = urlParameters.minutes;

    if(minutesToEvent === undefined){
        //define minuteToEvent to default value: 15 minutes
        minutesToEvent = defaultValueMTE;
    }

    //build calendar URL
    calendarUrl = "https://www.google.com/calendar/feeds/" + calendarId + "group.calendar.google.com/public/basic";

    //get current information of all events in calendar
    getEventInformation();

    //start checking every "checkInterval" seconds if any event is close to starting
    eventsInterval = window.setInterval(checkEventTimes, checkEventsInterval);

    //checks for events calendars updates every "checkCalendarInterval" seconds
    calendarInterval = window.setInterval(getEventInformation, checkCalendarInterval);
}

function onLoad(loaded){
    //stop looking for new events temporarly
    window.clearInterval(eventsInterval);

    //get information of next event
    var nextEventTime = nextEvent[0];
    var nextEventHours = nextEventTime.get('hour');
    var nextEventMinutes = nextEventTime.get('minute');

    if(nextEventMinutes === 0){
        nextEventMinutes = '00';
    }
    var eventTime = nextEventHours.toString().concat(":");
    var finalEventTime = eventTime.concat(nextEventMinutes.toString());

    var nextEventLocation = nextEvent[1];
    var nextEventDescription = nextEvent[2];
    var nextEventTitle = nextEvent[3];

    //add it to the HTML
    document.getElementById("eventTitle").innerHTML= nextEventTitle;
    document.getElementById("eventTime").innerHTML= finalEventTime;
    document.getElementById("eventLocation").innerHTML= nextEventLocation;
    document.getElementById("eventDescription").innerHTML= nextEventDescription;

    loaded();
}

function onResume(){
    //flashing hours
    setInterval(function(){
        document.getElementById("eventTime").style.color = "red";
    }, 2000);

    setTimeout(function(){
        setInterval(function(){
            document.getElementById("eventTime").style.color = "black";
        }, 2000);
    }, 1000);
}

function onPauseRequest(){
    return 0;
}

function onPause(){

}

function onUnload(created){
    //start checking every "checkInterval" seconds if any event is close to starting
    eventsInterval = window.setInterval(checkEventTimes, checkEventsInterval);

    //clean template data
    document.getElementById("eventTitle").innerHTML = '';
    document.getElementById("eventTime").innerHTML= '';
    document.getElementById("eventLocation").innerHTML= '';
    document.getElementById("eventDescription").innerHTML= '';

    created();
}

function onDestroy(destroyReady){
    window.clearInterval(eventsInterval);
    window.clearInterval(calendarInterval);
    destroyReady();
}

function getEventInformation(){
    console.log("Checking calendar for new events...");

    $.ajax({
        type: "GET",
        url: calendarUrl,
        dataType: "jsonp",
        success: function(xml){
            $(xml).find('entry').each(function(){
                var entryTitle = $(this).find('title').text();
                var entryContent = $(this).find('content').text();
                var entrySummary = $(this).find('summary').text();
                var splitedContent = entryContent.split("<br />");
                var splitedSummary = entrySummary.split("&nbsp;");

                var eventInfo = parseResult(splitedSummary, splitedContent);

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

                    //add title of event
                    eventInfo.push(entryTitle);

                    //push event to array of events
                    events.push(eventInfo);
                }
                else{
                    console.log("IGNORING OLD EVENT: " + eventInfo);
                }
            });

            console.log(" << LIST OF FOLLOWING EVENTS >>");
            for(var i = 0; i < events.length; i++){
                console.log(events[i]);
            }
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

    try{
        var description = resultContent[4].substring(19);       
    }
    catch(err){
        console.warn("Event has no location defined !");
        var description = resultContent[3].substring(19);
        var whereFinal = "";
    }

    parsedResult.push(whereFinal);
    parsedResult.push(description);

    return parsedResult;
} 

function checkEventTimes(){
    console.log("Checking if any event is going to start soon...");

    for(var i = 0; i < events.length; i++){
        var currentTime  = moment();
        var diff = events[i][0].diff(currentTime, 'minutes');

        if(diff <= minutesToEvent){
            nextEvent = events[i];
            //remove event from array of events
            events.splice(i, 1);

            console.log(" << PRITING REMAINING EVENTS >> ");
            for(var i = 0; i < events.length; i++){
                console.log(events[i]);
            }
            //call showMe in order to ask for airtime
            showMe();
        }
    }
}

//get all url parameters
function getUrlParams(url) {
    url = url.split("+").join(" ");

    var params = {}, tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(url)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}