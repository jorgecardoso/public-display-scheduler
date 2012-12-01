
setTimeout(addButton, 5000);

function clickHandler(e) {

  //document.documentElement.webkitRequestFullScreen();

}

var timer;
function mouseMoved() {
 	clearTimeout(timer);
	document.getElementById('pdscheduler').style.display='inline';
	timer = setTimeout(hide, 5000);	
}

function hide() {
	document.getElementById('pdscheduler').style.display='none';
}

document.addEventListener('mousemove', mouseMoved);

 function addButton() {
	// var div = document.createElement('div');
// 	div.id = "pdscheduler";
// 	document.body.appendChild(div);
// 	
// 	var buttonnode= document.createElement('input');
// 	buttonnode.setAttribute('type','button');
// 	buttonnode.setAttribute('name','sal');
// 	buttonnode.setAttribute('value','sal');
// 	buttonnode.addEventListener('click', clickHandler);
// 	
// 	div.appendChild(buttonnode);
}
