
function DirectoryList ( path ) {
    this.path = path;
    this.fileList = [];
}

DirectoryList.prototype.getFileList = function( fileListener ) {
	var $this = this;
	chrome.extension.onMessage.addListener(
  		function(request, sender, sendResponse) {
    		chrome.extension.onMessage.removeListener(arguments.callee);
    		
			chrome.tabs.remove($this.tabid);
			
			$this.fileList = request;
    		
    		fileListener(request);
  		});
  		
  		
	chrome.tabs.onUpdated.addListener(function onTabUpdated(tabId, changeInfo, _tab) {
		if ( _tab.id.toString() === $this.tabid.toString() ) {
			chrome.tabs.executeScript(_tab.id, {file: "directorylister-tab.js"});
			chrome.tabs.onUpdated.removeListener(arguments.callee);
		} 
	});
	
	chrome.tabs.create({}, function(_tab) {
		$this.tabid = _tab.id;
		console.log("Creating listing tab (" + $this.tabid + ") for: " + $this.path);
		chrome.tabs.update(_tab.id, {url:"file://"+$this.path, selected:false});
	});
	

};

