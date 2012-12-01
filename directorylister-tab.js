console.log("Directory Lister tab script loaded");

var links = document.getElementsByClassName("icon file");

var files = [];
for (var i = 0; i < links.length; i++) {
	filename = links[i].href.substring(links[i].href.lastIndexOf("/")+1, links[i].href.length);
	if ( !(filename.indexOf(".") == 0) ) { // skip system files
		files.push(links[i].href);
	}
}

chrome.extension.sendMessage(files);



