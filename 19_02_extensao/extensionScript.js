console.log("extensionScript.js is loading...");

var messageOnLoad = "onLoad";


function timeStamp() {
// Create a date object with the current time
  var now = new Date();
 
// Create an array with the current hour, minute and second
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds() ];
 
// Convert hour from military time
  time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
 
// If hour is 0, set it to 12
  time[0] = time[0] || 12;
 
// If seconds and minutes are less than 10, add a zero
  for ( var i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }
 
// Return the formatted string
  return  time.join(":");
}

//listen for messages coming from appScript.js  
document.addEventListener('msgFromAppScript', function(data) {
  var state = data.detail.state;

  var time = timeStamp();
  console.log(time + " | MESSAGES ExtensionScript | << Receiving message <" + state + "> from appScript of ");

  switch(state){
    case "created":
      var time = timeStamp();
      
      //sending message created to Extension
      //console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state + "> to Extension");
      //chrome.extension.sendMessage({state : state});

      //sending message "onLoad" to appScript
      console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + messageOnLoad +"> to appScript of");
      window.postMessage({state: messageOnLoad}, "http://localhost/27_02_simpleApp");
    break;

    case "loaded":
      console.log(time + " | MESSAGES ExtensionScript | >> Sending message <" + state +"> to Extension");
      chrome.extension.sendMessage({state : state}, function(){
        alert("done it!");
      });
    break;
  }
});

//listen for messages coming from extension
chrome.runtime.onMessage.addListener(
 function(message, sender) {
   var state = message.state;
   var time = timeStamp();

   console.log(time + " | MESSAGES ExtensionScript | << Receiving message <" + state + "> from Extension");

   switch(state){
   case "onLoad":
       console.log("MESSAGES ExtensionScript | >> Sending message <" + state +" to appScript of");
       window.postMessage({state: message.state}, "http://localhost/27_02_simpleApp");
   }
});