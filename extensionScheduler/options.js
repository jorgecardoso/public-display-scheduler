var backgroundPage = chrome.extension.getBackgroundPage();

document.getElementById("buttonAddApp").addEventListener("click",function(){
	var url = document.getElementById('inputAppUrl').value;
	var duration = document.getElementById('inputAppDuration').value;

	backgroundPage.addNewApp(url,duration);

});