/****************************************************************************************

    Asterisk Administration Console
    Asterisk CLI Module
    
    A simple web application that allows Asterisk users to administer their system
    from a web interface.

    TODO:
    * command completion 
    * command history
    * disable autoscroll
    * no-console option (just a command / response pipe)
    * multiple instances (return a cli object)
    * connect to multiple / other servers
    
****************************************************************************************/

var asteriskcli = (function () {

	var exports = {};
	var ast_console = null;
    var socket = null;
    var output = null;
    var input = null;
    
    var history = [];
    var hPointer = -1;
    
    exports.init = function(element, width, height) {
    
        // check for required packages
        if (!jQuery) {
            
        }
        if (!ansi_up) {
            console.log("Cannot color code - requires ansi_up");
        }
        
        if (!io) {
            console.log("This application requires socket.io to connect with the server.")
            console.log("Not loading CLI");
            return;
        }
    
        // cache a jquery object for the base element
        ast_console = $("#" + element);
        ast_console.addClass("ast-console");
        ast_console.addClass("ast-administrator-screen");
        
        // Empty anything that was in the div
        ast_console.empty();
        
        // Add the cli-output child element
        ast_console.append("<div class='ast-console-output'></div>");
        output = $(".ast-console-output");
        
        // Add the command input element
        ast_console.append("<input type='text' class='ast-console-input' />");
        input = $(".ast-console-input");
        
        ast_console.width(width - 8);
        ast_console.height(height);
        
        output.width(width - 8);
        output.height(height - 25);
        
        
        // Wire up events for the newly created elements
        input.keydown(function(e) {
            console.log("History Pointer -----> " + hPointer);
            if(e.which == 13) {
                var cmd = input.val();
                history.push(cmd);
                hPointer = history.length - 1;
                socket.emit("command", cmd);
                input.val("");
                input.focus();
            } else 
            if(e.which == 9) {
                e.preventDefault();
                var cmd = input.val();
                socket.emit("command", "core show help " + cmd);
                return false;
            } else
            // up arrow
            if (e.which == 38) {
                if (hPointer === -1) {
                    // no history yet
                } else {
                    input.val(history[hPointer]);
                    hPointer--;
                }
            } else 
            if (e.which == 40) {
                if ((history.length === 0) || (hPointer === (history.length - 1))) {
                    // no history yet
                } else {
                    hPointer++;
                    input.val(history[hPointer]);
                }
            }
        });
        
        // create the socket
        socket = io();
        
        // set the handler for socket events
        socket.on('console', function(data) {
        
            // split into individual lines with \n terminators
            var lines = data.match(/[^\n]+(?:\r?\n|$)/g);
        
        
            var rls = function() {
                var leadingSpaces = arguments[0].length;
                var str = '';
                while (leadingSpaces > 0) {
                    str += '&nbsp;';
                    leadingSpaces--;
                }
                return str;
            }
        
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
            
                if (line[0] === "|") {
                    line = "&nbsp;&nbsp;&nbsp;&nbsp;--&nbsp;" + line.substr(1);
                } else
                if (line[0] === "}") {
                    line = "&nbsp;&nbsp;==&nbsp;" + line.substr(1);
                }
                line = line.replace(/\n/g, "<br />");
                line = line.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
                line = line.replace(/^[ \t]+/mg, rls);
                //line = line.replace(/ /g, '&nbsp;');
                var item = "<div class='console-item'>" + ansi_up.ansi_to_html(line) + "</div>";
                output.append(item);
            
                // limit to 2000 lines
                var count = output.children().length;
                if (count > 2000) {
                    output.find('div').first().remove();
                }
            }
            
            output.scrollTop(output[0].scrollHeight);
        });

    
    };
    
    exports.send = function(command) {
        socket.emit("command", cmd);
    };

    exports.activate = function() {
        ast_console.show();
        output.scrollTop(output[0].scrollHeight);
        input.focus();
    };

	return exports;
}());



