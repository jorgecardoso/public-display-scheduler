
function setPlaceId(e) {
  localStorage.setItem("placeid", document.getElementById('placeid').value );
}


function setFolder(e) {
  localStorage.setItem("folder", document.getElementById('folder').value );
}

function setLocalPlayer(e) {
  localStorage.setItem("localVideoPlayerApp", document.getElementById('localplayer').value );
}

// Add event listeners once the DOM has fully loaded by listening for the
// `DOMContentLoaded` event on the document, and adding your listeners to
// specific elements when it triggers.

document.addEventListener('DOMContentLoaded', function () {
document.getElementById('placeid').value = localStorage.getItem("placeid");
document.getElementById('folder').value = localStorage.getItem("folder");
document.getElementById('localplayer').value = localStorage.getItem("localVideoPlayerApp");

  document.getElementById('myButton').addEventListener('click', setPlaceId);
  document.getElementById('buttonFolder').addEventListener('click', setFolder);
    document.getElementById('buttonLocalPlayer').addEventListener('click', setLocalPlayer);
});
