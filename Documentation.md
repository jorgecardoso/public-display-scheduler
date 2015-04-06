# << System Callbacks >> #

## onCreate() ##
This callback represents the application’s entry point method and is called only once while the application is in memory. After onCreate() the application will be in memory but not visible.

## onLoad(loaded) ##
When the system decides to give display time to the application onLoad() is called before the time is actually assigned to the application. The callback should be used to perform all necessary loading routines to ensure the application is ready to be displayed. When the application is fully loaded, it must call loaded() to inform the system.

### Example ###
```
function onLoad(loaded){

//get all necessary data
getJokesFromServer()

//when all data is loaded
loaded();

}
```

## onResume() ##
Before an application becomes visible on the display, onResume() is called. At this phase, applications should make sure they are ready to show content and ensure there is no noticeable delay before content is displayed by the application. This callback can be used to perform very fast initialization routines such as starting animations.

## onPauseRequest() ##
Before removing an application from the screen, the system calls onPauseRequest() giving the opportunity to applications request extra time before leaving the screen.
**Return:** Applications should return the necessary time in seconds.

### Example ###
```
function onPauseRequest(){

   var videoDuration = player.getDuration();
   var ellapsedTime = player.getCurrentTime();

   var extraTime = videoDuration - ellapsedTime;

   return extraTime;
}
```

## onPause() ##
Before an application is paused, the system calls onPause() to signal the application that is either not visible or partially visible. Paused applications may be quickly resumed by the system invoking onResume().

## onUnload(unloaded) ##
After removing an application from the screen and before unloading it, the system will call onUnload(). The application will continue in memory, waiting to be called to the foreground again.

### Example ###
```
function onUnload(unloaded){

   //clean template data
   document.getElementById("eventTitle").innerHTML = '';
   document.getElementById("eventTime").innerHTML= '';
   document.getElementById("eventLocation").innerHTML= '';

   //notifying the system that everything is unloaded and ready to be displayed again
   unloaded();
}
```

## onDestroy(destroyed) ##
Before destroying the application, the system will call onDestroy(). A destroyed application is removed from the memory and to be displayed again, the app should go through the lifecycle from the beginning. After performing any finalization routines the application must call "destroyed".

### Example ###
```
onDestroy(destroyed){

   //saving data to local storage
   localStorage.setItem("userInfo", info);

   //notifying the system that everything is destroyed
   destroyed();
}
```

# << Application Callbacks >> #

## showMe() ##
Applications can signal the system that they want display time by calling showMe(). The system will then apply it's internal policy based on priorities to determine when to give airtime to the app. This callback can only be used while an application is created.

### Example ###
```
function onCreate(){

   var alertBeforeEventTimeInMinutes = 15;

   setInterval(function(){

      var timeNextEvent = getNextEventTime();
      if(timeNextEvent < currentTime - alertBeforeEventTimeInMinutes)
         showMe(); 

   }, 30000);
}
```

## releaseMe() ##
Applications can signal the system that they cannot display any more content (perhaps due to a server error or other condition). This callback can only by used while an application is resumed.

### Example ###
```
function onResume(){
   //if a network error occurs
   releaseMe();
}
```