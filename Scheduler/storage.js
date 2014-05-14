console.log("storage.js e running...");

var data = {};

//given a key, gets the corresponding data from local storage
function getDataStorage(key){
	var def = $.Deferred();

	//get application's data
	chrome.storage.sync.get(key, function(data) {
    	printGreenMsg("STORAGE","Accessing application's data...","");
    	def.resolve(data.appsData);
    });

    return def;
}

//given a key, saves data to the local storage
function setDataStorage(key){
	
    data[key] = applications;

    chrome.storage.sync.set(data, function() {
    	printGreenMsg("STORAGE","Application's data saved !","");
    });
}