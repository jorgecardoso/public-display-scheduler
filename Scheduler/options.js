console.log("options.js is running...");

$(document).ready(function() {
	//global variables
	var backgroundPage = chrome.extension.getBackgroundPage();
	var table = $('#appsInfoTable').DataTable();
	var schedule = backgroundPage.schedule;

	document.getElementById("buttonAddApp").addEventListener("click", function(){
		var name = document.getElementById('inputAppName').value;
		var url = document.getElementById('inputAppUrl').value;
		var duration = document.getElementById('inputAppDuration').value;

	  	if (isNaN(duration)) 
	  	{
	    	alert("Duration field must be a number !");
	    	return;
	  	}

		var priority = document.getElementById('inputAppPriority').value;

		if (isNaN(priority)) 
	  	{
	    	alert("Priority field must be a number !");
	    	return;
	  	}

		var backgroundOption = document.getElementById("ddmBackgroundApp");
		var background = ddmBackgroundApp.options[ddmBackgroundApp.selectedIndex].value;

		if(background === "true")
			backgroundOption = true;
		else
			backgroundOption = false;

		var biggestId = backgroundPage.getBiggestId();
		var id = biggestId + 1;

		backgroundPage.addNewApp(id, name, url, parseInt(duration), parseInt(priority), backgroundOption);

		table.row.add([id,name,url,duration,priority,backgroundOption]).draw();
		document.getElementById("addNewApp").reset();

	});

	document.getElementById("buttonRemoveApp").addEventListener("click", function(){
		var confirmation = confirm("Are you sure you want to delete this application ?");

		if(confirmation === true){
			var selectedApp = table.row('.selected');
			var data = selectedApp.data();
			var appId = data[0];
			var appUrl = data[2];

			backgroundPage.removeApp(appId, appUrl);
			table.row('.selected').remove().draw(false);
		}
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

		if(appBck === true)
			document.getElementById("UpdatedBackgroundApp").selectedIndex = 0;
		else
			document.getElementById("UpdatedBackgroundApp").selectedIndex = 1;

		document.getElementById('divAppOptionsAdd').style.display = 'none';
		document.getElementById('divAppOptionsUpdate').style.display = 'block';
	});

	document.getElementById("buttonUpdate").addEventListener("click", function(){
		var updatedValues = [];

		var selectedApp = table.row('.selected');
		var data = selectedApp.data();
		var appId = data[0];

		var name = document.getElementById('inputUpdatedName').value;
		var url = document.getElementById('inputUpdatedUrl').value;
		var duration = document.getElementById('inputUpdatedDuration').value;

		if (isNaN(duration) || duration <= 0) 
	  	{
	    	alert("Duration field must be a number bigger than zero !");
	    	return;
	  	}

		var priority = document.getElementById('inputUpdatedPriority').value;

		if (isNaN(priority) || priority <= 0) 
	  	{
	    	alert("Priority field must be a number bigger than zero !");
	    	return;
	  	}

		var background = document.getElementById('UpdatedBackgroundApp').options[UpdatedBackgroundApp.selectedIndex].value;

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

		backgroundPage.updateApp(appId,updatedValues,boolBck);

		updatedValues.unshift(appId);

		selectedApp.data(updatedValues);

		selectedApp.draw();

		document.getElementById('divAppOptionsUpdate').style.display = 'none';
		document.getElementById('divAppOptionsAdd').style.display = 'block';		
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

//creates a table with all elements of an array
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