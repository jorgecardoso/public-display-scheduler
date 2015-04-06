# Introduction #

Public display systems are becoming increasingly complex. They are moving from passive closed systems to open interactive systems that are able to accommodate applications from several independent sources. This shift needs to be accompanied by more flexible and powerful application management.

What currently occurs in most public displays is that the displayed content is based on a pre-defined timetable where each content is given a certain amount of time. This traditional approach still fulfil current public display needs because most present applications are not interactive and it’s possible to know in advance the time they need to properly execute. However, this approach will become obsolete as the public displays move to the more complex envisioned scenario.

We have developed a complete framework as a Chrome Extension supporting a runtime lifecycle model for interactive public display applications that addresses several shortcomings of current display systems and will support some requirements of the new generation of displays.

A specific application framework that defines a more fine-grained runtime lifecycle will allow a better display resources management and allows programmers and system to negotiate the resources that an application needs in each state, guaranteeing an efficient usage of those resources on the one hand, and rapid application switching and loading, on the other hand.



# Lifecycle #

![https://dl.dropboxusercontent.com/u/2938039/runtime_lifecycle.png](https://dl.dropboxusercontent.com/u/2938039/runtime_lifecycle.png)

## **bold callbacks** ##
Messages from the Scheduler to the application.

## _italic callbacks_ ##
Messages from the application to the Scheduler.

# States #

| **Created** | **Loaded** | **Resumed** | **Paused** | **Destroyed** |
|:------------|:-----------|:------------|:-----------|:--------------|
|The application is in memory and shouldn’t be consuming too much resources because it will stay on this state waiting to be called to the foreground.|When an application reach this states, it means that the application is fully loaded and ready to be displayed.|Application is the foreground application and should display its content.|The application is paused either because it was interrupted or the airtime was over and the scheduler switched applications.|In this state, the applications is removed from the memory therefore the application isn’t consuming any resources. |

# Callbacks #

Note that all callbacks are called right before the state change.

| **onCreate** | **onLoad** | **onResume** | **onPauseRequest** | **onPause** | **onUnload** | **onDestroy** | **showMe** | **releaseMe** |
|:-------------|:-----------|:-------------|:-------------------|:------------|:-------------|:--------------|:-----------|:--------------|
|This represents the application’s entry point method and is called only once while the application is in memory.| At the onLoad() stage, applications should perform all necessary loading routines to ensure the application is ready to be displayed. The system expects application to reply with “loaded()”.|This callback is called immediately before the application is put visible on the display. This callback can be used to perform very fast initialization routines such as starting animations.|This callback signals the application that it should finish and its called a few seconds before calling onPause().| In this stage the application is either not visible or only partially visible. Can be used to pause animations, sounds and other unnecessary operations.|Called right before an application is unloaded. It should release all processing resources and clean navigation data as well as state information.|Signals the application that it is being removed from memory.|Applications can signal the system that they want display time by calling the showMe() method.|Applications can signal the system that they cannot display any more content calling releaseMe().|

# Application template #

The provided application is composed of a simple HTML structure with six boxes. Every time the scheduler invokes a callback, the name of the callback is displayed on the corresponding box.

## HTML Structure ##

```
<!DOCTYPE html>
<!-- 
Executes each lifecycle function 
-->
<html>

<head>
<title>Display Lifecycle on Screen</title>
</head>

<body>
    <!-- scripts -->
    <script src="app.js"></script>

    <h1> Lifecycle callbacks </h1>
    <input type="text" id="onCreateText">
    <input type="text" id="onLoadText">
    <input type="text" id="onResumeText">
    <input type="text" id="onPauseRequestText">
    <input type="text" id="onPauseText">
    <input type="text" id="onUnloadText">

</body>
</html>
```

## JS lifecycle code ##

```
var url = document.URL;
var appStopped = 0;

//lifecycle functions
function onCreate(){
    var time = timeStamp();
    console.log(time + " | LIFECYCLE | onCreate of " + url + " is running...");

    document.getElementById("onCreateText").value='onCreate';
}

function onLoad(loaded){
    console.log("LIFECYCLE | onLoad of " + url + " is running...");
    document.getElementById("onLoadText").value='onLoad';
    
    setTimeout(function(){
        loaded();
    },2000);
}

function onResume(){
    
    if(appStopped === 1){
        document.getElementById("onPauseText").value='';
    }
    
    console.log("LIFECYCLE | onResume of " + url + " is running...");
    document.getElementById("onResumeText").value='onResume';
}

function onPauseRequest(){
   console.log("LIFECYCLE | onPauseRequest of " + url + " is running...");
   document.getElementById("onPauseRequestText").value='onPauseRequest';
   return 0;
}

function onPause(){
    console.log("LIFECYCLE | onPause of " + url + " is running...");
    document.getElementById("onPauseText").value='onPause'; 

    appStopped = 1;
}

function onUnload(unloaded){
    console.log("LIFECYCLE | onUnload of " + url + " is running...");
    document.getElementById("onUnloadText").value='onUnload';
    
    //clear all variables
    setTimeout(function(){
        document.getElementById("onLoadText").value='';
        document.getElementById("onResumeText").value='';
        document.getElementById("onPauseRequestText").value='';
        document.getElementById("onPauseText").value='';
        document.getElementById("onUnloadText").value='';

        appStopped = 0;

        unloaded();
    },2000);
}

function onDestroy(destroyReady){
    console.log("LIFECYCLE | onDestroy of " + url + " is running...");
    destroyReady();
}
```

# Task #

Taking into account the specifications of the lifecycle and the template of an application, create your own public display application and test it in the scheduler.