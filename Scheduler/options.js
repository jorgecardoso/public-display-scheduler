$(document).ready(function() {
	//global variables
	var backgroundPage = chrome.extension.getBackgroundPage();
	var table = $('#appsInfoTable').DataTable();
	var schedule = backgroundPage.schedule;

	document.getElementById("buttonAddApp").addEventListener("click", function(){
		var name = document.getElementById('inputAppName').value;
		var url = document.getElementById('inputAppUrl').value;
		var duration = document.getElementById('inputAppDuration').value;
		var priority = document.getElementById('inputAppPriority').value;
		var backgroundOption = document.getElementById("ddmBackgroundApp");
		var background = ddmBackgroundApp.options[ddmBackgroundApp.selectedIndex].value;

		if(background === "true")
			backgroundOption = true;
		else
			backgroundOption = false;

		backgroundPage.addNewApp(name, url, parseInt(duration), parseInt(priority), backgroundOption);
		table.row.add([5,name,url,duration,priority,backgroundOption]).draw();
		document.getElementById("addNewApp").reset();

	});

	document.getElementById("buttonRemoveApp").addEventListener("click", function(){
		var selectedApp = table.row('.selected');
		var data = selectedApp.data();
		var appId = data[0];

		backgroundPage.removeApp(appId);
		table.row('.selected').remove().draw(false);
	});

	document.getElementById("buttonUpdateApp").addEventListener("click", function(){
		var selectedApp = table.row('.selected');
		var data = selectedApp.data();
		var appId = data[0];
		var appName = data[1];
		var appUrl = data[2];
		var appDuration = data[3];
		var appPriority = data[4];
		var appBck = data[5];

		document.getElementById('inputUpdatedName').value = appName;
		document.getElementById('inputUpdatedUrl').value = appUrl;
		document.getElementById('inputUpdatedDuration').value = appDuration;
		document.getElementById('inputUpdatedPriority').value = appPriority;
		document.getElementById('inputUpdatedName').value = appName;
		document.getElementById('UpdatedBackgroundApp').value = appBck;
		
		document.getElementById('appInfo').style.display = 'block';
	});

	document.getElementById("buttonSendUpdate").addEventListener("click", function(){
		var updatedValues = [];

		var selectedApp = table.row('.selected');
		var data = selectedApp.data();
		var appId = data[0];

		var name = document.getElementById('inputUpdatedName').value;
		var url = document.getElementById('inputUpdatedUrl').value;
		var duration = document.getElementById('inputUpdatedDuration').value;
		var priority = document.getElementById('inputUpdatedPriority').value;
		var backgroundOption = document.getElementById("UpdatedBackgroundApp");
		var background = ddmBackgroundApp.options[ddmBackgroundApp.selectedIndex].value;

		updatedValues.push(name);
		updatedValues.push(url);

		var intDuration = parseInt(duration);
		updatedValues.push(intDuration);

		var intPriority = parseInt(priority);
		updatedValues.push(intPriority);

		var boolBck;
		if(background === "true"){
			boolBck = true;
		}
		else{
			boolBck = false;
		}

		updatedValues.push(boolBck);

		backgroundPage.updateApp(appId,updatedValues);

		updatedValues.unshift(appId);

		selectedApp.data(updatedValues);

		document.getElementById('appInfo').style.display = 'none';	
	});

	$('#appsInfoTable tbody').on('click', 'tr', function(){
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });

	var applications = backgroundPage.applications;

	createTable(table,applications);
});

function createTable(table,applications){
	
	for(var i = 0; i < applications.length; i++){
		var appId = applications[i].id;
		var appName = applications[i].name;
		var appUrl = applications[i].url;
		var appDuration = applications[i].duration;
		var appPriority = applications[i].priority;
		var appBck = applications[i].background;

		table.row.add([appId,appName,appUrl,appDuration,appPriority,appBck]).draw();
	}
}