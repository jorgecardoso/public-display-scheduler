// Copyright (c) 2011 Jorge C. S. Cardoso

/*
 * The local folder for videos. 
 */
var localVideoFolder = localStorage.getItem("folder");//"file:///Users/jorge/Desktop/videos"

var localVideoPlayerApp = localStorage.getItem("localVideoPlayerApp");

/* Have we started the scheduler? */
var started = false;

/* The tab that our scheduler is controlling */
var tab;

var tabListDirectory;

/* The timer used to change content on the tab */
var timer = undefined;

var timerSchedule;

var videoList = [];

var currentVideo = 0;

var schedule = [
{url:"http://jorgecardoso.eu", duration: 30, cron:"*/30 * * * * *"},
{url:"http://jorgecardoso.eu/1", duration: 10, cron:"*/30 * * * * *"},
{url:"http://jorgecardoso.eu/2150", duration: 10, cron:"0 50 21 * * *"}
];

var current = 0;

var placeid;

var url;

//requestSchedule();

var cron = new Cron();
 
function updateTimeouts() {
	console.log("Updating timeouts: ");
	for (var i = 0; i < schedule.length; i++) {
      	schedule[i].timeout= schedule[i].cronjob.getNextTimeout();
      	console.log(schedule[i].url + ": " + schedule[i].timeout);
	}
}

function setupJobs() {
	console.log("Setting up cron jobs: ");
	for (var i = 0; i < schedule.length; i++) {
		schedule[i].cronjob = new Cron.Job( schedule[i].cron, function () {
        		console.log("Ran ");
      		});
	}
}

setupJobs();
updateTimeouts();

function getNextJob() {
	var toReturn;
	
	updateTimeouts();
	
	for (var i = 0; i < schedule.length; i++) {
		var timeout = schedule[i].timeout;
		if ( timeout < 1000 ) {
			
			toReturn = schedule.splice(i, 1)[0];
			schedule.push(toReturn);
			toReturn.cronjob.run();
			return toReturn;
		}
	}
}

//start();
setPlayerTimer(1000);
//chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.tabs.onRemoved.addListener(onTabRemoved);

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
			timerSchedule = setTimeout(requestSchedule, 10*60*1000);
			
			setPlayerTimer(1000);
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



function timerEllapsed() {
	timer = undefined;
	log("Timer ellapsed");
	if (started) {
		var next = getNextJob();
		
		if ( typeof(next) == 'undefined' ) {
			console.log("Nothing to run right now");
			setPlayerTimer(5000);
			return;
		} 
		
		//current = (current+1)%schedule.length;
		
		var url = next.url;
		var duration = next.duration;
		var comment = next.comment;
		if ( typeof(comment) == 'undefined' ) {
			comment = "";
		}
		
		if ( url.indexOf("localvideo") == 0 ) { // file content is handled differently
		
		
			/*
			 * If the next content is a local file, refresh the list of files
 			 */

			reListFiles();

		
		
			// get the next video to play
			if ( videoList.length == 0 ) {
				// oops, no videos  in dir
				setPlayerTimer(1000);
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
				setPlayerTimer(1000);
				return;
			}
			
			localVideoPlayerApp = localStorage.getItem("localVideoPlayerApp");
			url = localVideoPlayerApp + "?video=" + url;
			
		}
		log("Loading app: " + url + " for " + duration + " seconds." + "(" +comment + ")");
		setPlayerTimer(duration*1000);

		try {
			chrome.tabs.update(tab.id, {url: url, selected:true});
		} catch (err) {
			log("Could not update tab.");
			stop();
		} 
		
		
		
		
		
	//	alert("Timer");
	} else {
		//stoppinh
	}
}

function onTabUpdated(tabId, changeInfo, _tab) {
	if (tabId == tab.id && changeInfo.status == 'complete') {
		
			log("Main Tab updated.");
			log("Injecting content script and css...");
			chrome.tabs.executeScript(tabId, {file: "content.js"});
			chrome.tabs.insertCSS(tabId, {file: "content.css"});
		
	} else if (tabId == tabListDirectory.id && changeInfo.status == 'complete' ) {
		log("Tab ListDirectory updated");
		
		chrome.tabs.executeScript(_tab.id, {file: "listdirectory.js"});
	}
}

function onTabRemoved(tabId, removeInfo) {
	log("Tab removed: " + tabId );
	if (typeof(tab) != "undefined" && tabId == tab.id) {
		log("Main tab closed");
		stop();
		tab = undefined;
	} else if (typeof(tabListDirectory) != "undefined" && tabId == tabListDirectory.id ) {
		log("ListDirectory tab closed");
		tabListDirectory = undefined;
	}
}

function tabCreated(_tab) {
	log("Main tab created: " + _tab.id);
	tab = _tab;
	
	chrome.tabs.update(tab.id, {url: 'face.html', selected:true});
}


// Directory file listing

function reListFiles() {
	log("Relisting video files ");
	localVideoFolder = localStorage.getItem("folder");
	if ( typeof(tabListDirectory) == "undefined" ) {
		log("Creating tab to list files");
		chrome.tabs.create({}, tabCreatedListDirectory);
	} else {
		tabCreatedListDirectory(tabListDirectory);
	}
}

function tabCreatedListDirectory(_tab) {
	log("ListDirectory tab created: " + _tab.id);
	tabListDirectory = _tab;
	
	chrome.tabs.update(_tab.id, {url:localVideoFolder, selected:false});

}


chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    log("File list: " + request);
    videoList = request;
  });


function start() {
	log('Starting');
	chrome.tabs.create({}, tabCreated);
	reListFiles();
	
	started = true;
}

function setPlayerTimer(duration) {
	if ( typeof(timer) == 'undefined' ) {
		log("Setting player timer to: " + duration);
		timer = setTimeout(timerEllapsed, duration);
	} else {
		log("Timer is still running, ignoring");
	}
}

function stop() {
	log('Stoping');
	clearTimeout(timer);
	started = false;
} 


function log(message) {
	var date = new Date();
	console.log(date.toString() + ": " + message);
}
