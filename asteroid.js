#!/usr/bin/node

/****************************************************************************************

    Asteroid Server
    
    Author: Steven Sokol (steven.sokol@gmail.com)

****************************************************************************************/

// Since we run this as a service...
process.chdir('/opt/asteroid');

// Web Stack
var express = require("express");
var http = require('http');
var https = require('https');
var sockio = require("socket.io");

// Other requirements
var fs = require('fs');
var url = require('url');
var path = require('path');
var bp = require('body-parser');
var strip = require('strip-ansi')
var net = require('net');

// Configuration file
var configFile = '/etc/asterisk/asteroid.conf';
if (!fs.existsSync(configFile)) {
    console.log("No configuration file found at: " + configFile)
    process.exit(1);
}
var config = require(configFile);

var app = express();
var server = http.createServer(app);

var privateKey  = fs.readFileSync('sslcert/key.pem', 'utf8');
var certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate, passphrase: config.passphrase};

var base = "/etc/asterisk";
var webroot = path.join(__dirname, "/web/");

// Web server configuration options
app.use(bp.json());
app.use("/", express.static(webroot));

// Load a file from the server
app.get("/file/load", function(req, res) {
	var urlParts = url.parse(req.url, true);
	var query = urlParts.query;
	if (query.filepath) {
		var fname = path.join(base, query.filepath);
		console.log(fname);
		fs.readFile(fname, function(err, data) {
			if (data) {
				res.send(200, JSON.stringify({"name": path.basename(fname), "filepath": path.basename(fname), "type": path.extname(fname), "text": data.toString()}));
			} else {
				res.send(404, "File not found.");
			}
		});
	} else {
		res.send(500, "Invalid request. No filepath value provided.");
	}
});

// Retrieve a list of files from the server
app.get("/file/list", function(req, res) {
	var urlParts = url.parse(req.url, true);
	var query = urlParts.query;

	fs.readdir(base, function(err, files) {

		var ret = {};
		var done = 0;
		ret.path = base;
		ret.files = [];

		var checkDone = function() {
			if (done == files.length) {
				res.send(200, JSON.stringify(ret));
				return true;
			}
			return false;
		}
		
		var getStat = function(fname) {
			fs.stat(fname, function(err, stats) {
				if (stats) {
					if (stats.isDirectory()) {
						ret.files.push({"name": path.basename(fname), "type": null, "directory": true});
					} else {
						ret.files.push({"name": path.basename(fname), "filepath": path.basename(fname), "type": path.extname(fname), "directory": false});
					}
				} else {
					console.log(err);
				}
				done++;
				checkDone();
			});
		}
		
		if (err) {
			res.send(404, "Requested path not found.");
		} else {
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				if (file[0] === ".") {
					done++;
					if (checkDone() === false) continue;
				} else {
					getStat(base + "/" + file);
				}
			}
		}
	});
});

app.post("/file/save", function(req, res) {
	var base = "/etc/asterisk/";	
	var fname = req.body.filepath;
	var text = req.body.text;
	var commit = req.body.commit;
	
	if ((fname) && (text)) {
		fname = path.join(base,  fname); // super dangerous
		console.dir("Saving: " + fname + " (commit = " + commit + ")");
		fs.open(fname, "w", function(err, fd) {
			var bt = new Buffer(text);
			if ((err) || (!fd)) {
			    res.send(501, "Error in write: " + err);
				console.log("Cannot write file - invalid fd or something.");
				console.log(err);
				return
			}
			fs.write(fd, bt, 0, bt.length, 0, function(err, written, buf) {
			    if (err) {
				    res.send(501, "Error in write: " + err);
				    return;
			    }
				fs.close(fd, function() {
				    res.send(200, "File" + fname + " saved.");
				});
				cli.write("core reload\0");
			});
		});
	} else {
		res.send(500, "Missing parameters required to save.");
	}
});


app.get("/apps/list", function(req, res) {

});

app.get("/apps/load", function(req, res) {

});

// Create http and ws servers
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(443);
var io = sockio.listen(httpsServer);

// Create http redirect server
var redirect = express();
redirect.use(function requireHTTPS(req, res, next) {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
var httpServer = http.createServer(redirect);
httpServer.listen(80);

// Asterisk Console Listener / Writer
// TODO: Move to a separate module / file?

var cli = null;
var silent = false;

var connectCLI = function() {
    setTimeout(function() {
        cli = net.createConnection("/var/run/asterisk/asterisk.ctl");
        if (!cli) {
            return reconnectCLI();
        }
        
        cli.on("connect", function() {
            console.log("Connected to the Asterisk CLI socket.");
            cli.write("core set verbose atleast 5\0");
            cli.write("core set debug atleast 5\0");
            cli.write("logger mute silent\0");
        });

        cli.on("data", function(data) {
            var text = data.toString('ascii');
            var channel = "console";
            io.sockets.emit(channel, text);
        });

        cli.on("end", function() {
            io.sockets.emit("console", "  == Asterisk disconnected!");
            connectCLI();
        });
        
        
    }, 1000);
};



io.set('log level', 1);
io.sockets.on('connection', function (socket) {
    console.log("Remote client connection.");
    socket.emit("console", "Connected to Asterisk via web CLI interface.");
    
    // TODO: process command requests from clients
    socket.on("command", function(data) {
    	var command = data.command;
    	console.dir(data);
    	if (data[0] === "!") {
    	    console.log("Illegal attempt to do rooty stuff.");
    	    io.sockets.emit("console", "You're a very naughty boy. No root access from here.");
    	} else {
    	    cli.write(data + "\0");
    	}
    });


    // TODO: process command requests from clients
    socket.on("completion", function(data) {
    	var command = data.command;
    	console.dir(data);
    	if (data[0] === "!") {
    	    console.log("Illegal attempt to do rooty stuff.");
    	    io.sockets.emit("console", "You're a very naughty boy. No root access from here.");
    	} else {
    	    cli.write(data + "\t\0");
    	}
    });
});

connectCLI();