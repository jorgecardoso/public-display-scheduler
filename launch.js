
function clickHandler(e) {

  //document.documentElement.webkitRequestFullScreen();
  localStorage.setItem("placeid", document.getElementById('placeid').value );

}
// Add event listeners once the DOM has fully loaded by listening for the
// `DOMContentLoaded` event on the document, and adding your listeners to
// specific elements when it triggers.

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('myButton').addEventListener('click', clickHandler);
});
