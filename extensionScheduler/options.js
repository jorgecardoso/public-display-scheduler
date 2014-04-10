var backgroundPage = chrome.extension.getBackgroundPage();

document.getElementById("buttonAddApp").addEventListener("click",function(){
	var url = document.getElementById('inputAppUrl').value;
	var duration = document.getElementById('inputAppDuration').value;
	var priority = document.getElementById('inputAppPriority').value;
	var backgroundOption = document.getElementById("ddmBackgroundApp");
	var background = ddmBackgroundApp.options[ddmBackgroundApp.selectedIndex].value;

	if(background === "true")
		backgroundOption = true;
	else
		backgroundOption = false;

	backgroundPage.addNewApp(url,parseInt(duration),parseInt(priority),backgroundOption);

});