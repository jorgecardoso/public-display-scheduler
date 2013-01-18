// Copyright (c) 2011 Jorge C. S. Cardoso

var MAINTAB = "mainTab";
/*
 * The local folder for videos. 
 */
var localVideoFolder = localStorage.getItem("folder");//"file:///Users/jorge/Desktop/videos"

/*
 * The location of the local video player page.
 */
var localVideoPlayerApp = localStorage.getItem("localVideoPlayerApp");

/*
 * Interval between requests to update the schedule.
 */
var scheduleRequestDelay = 10*60*1000;

/*
 * Have we started the player? 
 */
var started = false;

/* The tabs that our scheduler is controlling */
//var tab;

var tabs = new Object();

var tabListDirectory;

/* The timers used to change content on the tab */
var timers = new Object();
var timeouts = new Object();

var timerSchedule;

var videoList = [];

var currentVideo = 0;

var schedule = [
{url:"http://jorgecardoso.eu", duration: 30, cron:"*/30 * * * * *"},
{url:"http://jorgecardoso.eu/1", duration: 10, cron:"*/30 * * * * *"},
{url:"http://jorgecardoso.eu/2150", duration: 10, cron:"0 50 21 * * *"}
];

var lastScheduleJSON;

var current = 0;

var placeid;

var url;

var cron;

/****************************** Cron job functions ********************/
function updateJobTimeouts() {
	log("Updating timeouts: ");
	for (var i = 0; i < schedule.length; i++) {
      	schedule[i].timeout= schedule[i].cronjob.getNextTimeout();
      	log(schedule[i].url + ": " + schedule[i].timeout);
	}
}

function setupJobs() {
	log("Setting up cron jobs: ");
	for (var i = 0; i < schedule.length; i++) {
	
		if ( typeof(schedule[i].tabName) != "undefined" ) {
			timerName = schedule[i].tabName;
		} else {
			timerName = MAINTAB;
		}
		
		setPlayerTimer(timerName, 1000+Math.random()*10000 );
		
		schedule[i].cronjob = new Cron.Job( schedule[i].cron, function () {
        		log("Ran job");
      		});
	}
}



function getNextJob(tabName) {
	var toReturn;
	
	updateJobTimeouts();
	
	for (var i = 0; i < schedule.length; i++) {
		var jobTab = schedule[i].tabName;
		if ( typeof(jobTab) == "undefined" ) {
			jobTab = MAINTAB;
		}
		if ( tabName != jobTab ) {
			continue;
		}
		var timeout = schedule[i].timeout;
		if ( timeout < 1000 ) {
			
			toReturn = schedule.splice(i, 1)[0];
			schedule.push(toReturn);
			toReturn.cronjob.run();
			return toReturn;
		}
	}
	
	return undefined;
}

/********************************* Schedule requests ********************/

function requestSchedule( ) {
	log("Requesting schedule");
	placeid = localStorage.getItem("placeid");
	url = "https://pd-player.appspot.com/getschedule?placeid="+placeid;

	log("Using url: " +url);

	var head = document.getElementsByTagName('head')[0];
	
	for (i = 0; i < head.childNodes.length; i++) {
		log(" " +head.childNodes[i].toString());
		if ( typeof(head.childNodes[i].src) != 'undefined' && head.childNodes[i].src == url ) {
			head.removeChild(head.childNodes[i]);
		}
	}

	var script = document.createElement('script');
    script.type = "text/javascript";
    script.src = url;
    document.getElementsByTagName('head')[0].appendChild(script);
}

			
function onSchedule(sc) {
	try {
  		log("Got schedule from server: " +sc);

		if ( JSON.stringify(sc) == lastScheduleJSON ) {
			// nothing changed
			log("Nothing changed");
			timerSchedule = setTimeout(requestSchedule, scheduleRequestDelay);
			return;
		}
		
		lastScheduleJSON = JSON.stringify(sc);
		schedule = sc;
		
		for ( i = 0; i < schedule.length; i++ ) {
			log("Url: " + schedule[i].url);
			log("Duration: " + schedule[i].duration);
		}
		if ( schedule.length > 0 ) {
		
			/*
			 We got a schedule, so re-fetch it in ten minutes to check for changes
			*/
			setupJobs();
			timerSchedule = setTimeout(requestSchedule, scheduleRequestDelay);
			
			//setPlayerTimer(1000);
			return;
		}
		
  	} catch(err)	{
 		 log("Oops: " + err);
 	}
	
	/*
	* We got an empty schedule, so try again in a minute...
	*/
	timerSchedule = setTimeout(requestSchedule, 1*60*1000);
	
}

/******************************* App switching **********************/

function timerEllapsed(timerName) {
	timers[timerName] = undefined;
	log("Timer '" + timerName + "' ellapsed");
	if (started) {
		var next = getNextJob(timerName);
		
		if ( typeof(timeouts[timerName]) == "undefined" ) {
			timeouts[timerName] = new Object();
		}
			
		if ( typeof(next) == 'undefined' ) {
			log("Nothing to run right now");
			
			var timeout = timeouts[timerName].timerTimeout;
			if ( typeof (timeout) == "undefined" ) {
				timeout = 5000;
				timeouts[timerName].timerTimeout = timeout;
			}
			timeouts[timerName].timerTimeout *= 2; 
			setPlayerTimer(timerName, timeout);
			return;
		} 
		timeouts[timerName].timerTimeout = 0;
		//current = (current+1)%schedule.length;
		
		var url = next.url;
		var duration = next.duration;
		var comment = next.comment;
		if ( typeof(comment) == 'undefined' ) {
			comment = "";
		}
		var tabName = next.tabName;
		if ( typeof(tabName) == 'undefined' ) {
			tabName = MAINTAB;
		}
		
		/*
		 * If we don't have network, play local content
		 */
		if ( !navigator.onLine ) {
			url = "localvideo";
		}
		
		if ( url.indexOf("localvideo") == 0 ) { // file content is handled differently
		
		
			/*
			 * If the next content is a local file, refresh the list of files
 			 */

			reListFiles();

		
		
			// get the next video to play
			if ( videoList.length == 0 ) {
				// oops, no videos  in dir
				setPlayerTimer(timerName, 1000);
				return;
			}
			
			currentVideo++;
			if ( currentVideo >= videoList.length ) {
				currentVideo = 0;
			}
			url = videoList[currentVideo];
			
			// parse file duration in the filename
			var dash = url.lastIndexOf("-");
			var dot = url.lastIndexOf(".");
			if ( dash != -1 && dot != -1 ) {
				duration = url.substring(dash+1, dot);
				log("Detected duration in filename: " + duration);
			} else {
				log("Could not find duration in filename.");
				setPlayerTimer(timerName, 1000);
				return;
			}
			
			localVideoPlayerApp = "file://"+localStorage.getItem("localVideoPlayerApp");
			url = localVideoPlayerApp + "?video=" + url;
			
		}
		log("Loading app: " + url + " for " + duration + " seconds." + "(" +comment + ")");
		setPlayerTimer(timerName, duration*1000);

		try {
			//chrome.tabs.update(tab.id, {url: url, selected:true});
			checkCreateAndUpdateTab(timerName, url);
		} catch (err) {
			log("Could not update tab.");
			stop();
		} 
		

	//	alert("Timer");
	} else {
		//stoppinh
	}
}

/************************** Tab management **************************/

function checkCreateAndUpdateTab(tabName, url) {
	log("Checking if tab " + tabName + " exists");
	if ( typeof(tabs[tabName]) == "undefined" ) {
		createAndUpdate(tabName, url);
	} else {
		log("Tab " + tabName + " exists. Updating with url: " + url);
		chrome.tabs.update(tabs[tabName].tab.id, {url: url, selected:true});
	}
}


function createAndUpdate(tabName, url) {
	log("Creating tab " + tabName);
	chrome.tabs.create({}, generateTabCreatedAndUpdate(tabName, url));
	
}


function onTabUpdated(tabId, changeInfo, _tab) {
	if (changeInfo.status == 'complete') {
		
			
			log("Injecting content script and css...");
			chrome.tabs.executeScript(tabId, {file: "content.js"});
			chrome.tabs.insertCSS(tabId, {file: "content.css"});
		
	} 
}

function onTabRemoved(tabId, removeInfo) {
	log("Tab removed: " + tabId );
	if (typeof(tabs[MAINTAB].tab) != "undefined" && tabId == tabs[MAINTAB].tab.id) {
		log("Main tab closed");
		stop();
		tabs[MAINTAB] = undefined;
		//tab = undefined;
	} 
}

function tabCreated(_tab, tabName) {
	log("Tab created: " + _tab.id + " " + tabName);
	//tab = _tab;
	
	tabs[tabName] = new Object();
	tabs[tabName].tab = _tab;
	
	
	//chrome.tabs.update(tab.id, {url: 'face.html', selected:true});
}
function generateTabCreatedAndUpdate(myTabName, url) {
	log("Creating tab " + myTabName);
    return function (_tab) {
        tabCreated(_tab, myTabName);
        log("Updating tab " + myTabName + " with url: " + url);
		chrome.tabs.update(_tab.id, {url: url, selected:true});
    }
}

function generateTabCreated (myTabName) {

    return function (_tab) {
        tabCreated(_tab, myTabName);

    }
}
/************************ Directory file listing *********************/

function reListFiles() {
	a = new DirectoryList(localStorage.getItem("folder"));
	a.getFileList(onFileList);
}

function onFileList(request) { 
    log("File list: " + request);
    videoList = request;
}


function start() {
	log('Starting');
	//chrome.tabs.create({}, tabCreated);
	checkCreateAndUpdateTab(MAINTAB, "face.html");
	reListFiles();
	
	started = true;
}

function stop() {
	log('Stoping');
	clearTimeout(timer);
	started = false;
} 

function generateTimerEllapsed(timerName) {

    return function () {
        timerEllapsed(timerName);
    }
}

function setPlayerTimer(timerName, duration) {
	if ( typeof(timers[timerName]) == 'undefined' ) {
		log("Setting player timer '" + timerName + "' to: " + duration);
		timers[timerName] = setTimeout(generateTimerEllapsed(timerName), duration);
	} else {
		log("Timer '" + timerName + "' is still running, ignoring");
	}
}


/********************** Logging *************************/
function log(message) {
	var date = new Date();
	console.log(date.toString() + ": " + message);
}


/********************** Main *****************************/
function main() {
	cron = new Cron();
	setupJobs();
	updateJobTimeouts();
	chrome.tabs.onUpdated.addListener(onTabUpdated);
	chrome.tabs.onRemoved.addListener(onTabRemoved);

	requestSchedule();

	start();
	setPlayerTimer(MAINTAB, 1000);

}

main();