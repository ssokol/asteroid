var asterisksoftphone = (function () {
	
	var exports = {};

    // The unique username identifying the user
    var appId = null;
    var endpointId = null;
    var client = null;
    var startCall = null;
    var answerCall = null;
    var endCall = null;
    var extension = null;
    
    var ring = null;
    var ringTimer = null;
    
    var startup = null;
    var ringTone = null;
    var joinTone = null;
    var leaveTone = null;
    var messageInTone = null;
    var messageOutTone = null;
    var appId = null;
    var endpointId = null;
    var register = null;
    var display1 = null;
    var display2 = null;
    
    exports.init = function(app, endpoint) {

        startCall = $("#ast-phone-call");
        endCall = $("#ast-phone-hangup");
        answerCall = $("#ast-phone-answer");
        extension = $("#ast-phone-dialstring");
        appId = $("#ast-phone-respoke-appId");
        endpointId = $("#ast-phone-respoke-endpointId");
        register = $("#ast-phone-respoke-register");
        display1 = $("#ast-phone-display-line-1");
        display2 = $("#ast-phone-display-line-2");
        
        appId.val(localStorage.getItem("respoke-appId"));
        endpointId.val(localStorage.getItem("respoke-endpointId"));
        
        var registerWithRespoke = function() {
        
            var app = appId.val();
            var endpoint = endpointId.val();
            
            if (!app || !endpoint) { 
                return;
            }
            
            client = respoke.createClient({
                appId: app,
                developmentMode: true
            });    

            // "connect" event fired after successful connection to Respoke
            client.listen("connect", function(e) {
                startup.play();
                register.html("Unregister");
            });

            client.listen("call", function(c) {
        
                $(".ast-phone-button").hide();
            
                console.log("Call Created");
                console.log("--------------------------------------------");
                console.dir(c.call);
                console.log("--------------------------------------------");
                
                c.call.listen("hangup", function() {
                    $(".ast-phone-button").hide();
                    display1.html("&nbsp;");
                    display2.html("&nbsp;");
                    startCall.show();
                    leaveTone.play();
                });
        
                c.call.listen("connect", function() {
                    //joinTone.play();
                });
        
                c.call.listen("answer", function() {
                    $(".ast-phone-button").hide();
                    endCall.show();
                });
            
                if (c.call.caller) {
                    // we're the caller, so enable the hangup button
                    display1.html(extension.val());
                    display2.html("&nbsp;");
                    endCall.show();
                } else {
                    // incoming call
                    ringTone.play();
                    answerCall.show();
                    
                    if (c.call.callerId) {
                        if (c.call.callerId.name) {
                            display1.html(c.call.callerId.name);
                        }
                        if (c.call.callerId.number) {
                            display2.html(c.call.callerId.number);
                        }
                    }
                }            
            
            });
            
            // connect to respoke
            client.connect({
                endpointId: endpoint
            }); 
            
            // make the div draggable
            $(".ast-softphone").draggable({
                handle: ".ast-softphone-grip"
            });            
            localStorage.setItem("respoke-appId", app);
            localStorage.setItem("respoke-endpointId", endpoint);
        };
        
        register.click(function() {
            if (client) {
            
            } else {
                registerWithRespoke();
            }
        });
        
        startCall.click(function() {
            client.startAudioCall({endpointId: extension.val()});
        });

        endCall.click(function() {
            client.calls[0].hangup();
        });

        answerCall.click(function() {
            client.calls[0].answer();
        });

 
		ringTone = new Audio("../sounds/alert23.mp3");
		joinTone = new Audio("../sounds/communications_start_transmission.mp3");
		leaveTone = new Audio("../sounds/communications_end_transmission.mp3");
		messageInTone = new Audio("../sounds/computerbeep_11.mp3");
		messageOutTone = new Audio("../sounds/computerbeep_9.mp3");
		startup = new Audio("../sounds/computer_activate.mp3");
		
		var appIdValue = localStorage.getItem("respoke-appId");
		var endpointIdValue = localStorage.getItem("respoke-endpointId");
		if (appIdValue && endpointIdValue) {
		    registerWithRespoke();
		}

    }
    
	return exports;
}());
