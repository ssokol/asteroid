// Enable respoke debugging
respoke.log.enableAll();

// App ID from the Respoke Dashboard for your App
var appId = "4e1f5bb2-1a53-453f-870f-9f8040fd761f";

// The unique username identifying the user
var endpointId = "webcaller";

// Create an instance of the Respoke client using your App ID
var client = respoke.createClient({
    appId: appId,
    developmentMode: true
});

// "connect" event fired after successful connection to Respoke
client.listen("connect", function(e) {
    console.log("Connected to Respoke!", e);
    $("#myid").html(e.target.endpointId);
});

// call variable
var call = null;
/*
function handleCall(c) {

    // only do one call at a time
    if (call) return;

    // cache a reference to the call
    call = c;
    
    // enable hangup button
    $("#hangup").removeAttr("disabled");
    
    // listen for hangup event
    c.listen("hangup", function(e) {
      $("#hangup").attr("disabled", "disabled");
      call = null;
    });
}



client.listen("call", function(e) {
  var c = e.call;
  
  // add handlers for the call
  handleCall(c);
  
  // exit if we're the originating party
  if (c.caller) {
    return;
  }
  
  // display the caller id info if available
  if (c.callerId) {
    var from = c.callerId.name + " (" + c.callerId.number + ")";
    $("#clid").html(from);
  }
  
  // answer the call
  c.answer();
});

*/
$(document).ready(function() {
    
    $("#call").click(function(e) {
        if (call) return;
        client.startAudioCall({
            endpointId: "foobar"
        });
    });
  
    $("#hangup").click(function() {
        if (call) {
            call.hangup();
        }
    });

    // connect to respoke
    client.connect({
        endpointId: endpointId
    });  

});
