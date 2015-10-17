# asteroid

A minimalist web interface for the Asterisk communications engine. asteroid includes a configuration file editor, a web console / cli and a web softphone (currently using Respoke). A small node.js-based server component acts as a bridge between Asterisk and the client, eliminating the need to log into the underlying Linux system.

### Major Caveat 1: NOT SECURE

At this point I have not built any security into asteroid, so anyone who can hit the computer on port 443 can drive. This could be an expensive problem if your Asterisk is hooked up to phone lines or SIP trunks. Do not use this on a production system without securing it. 

Also, as it stands, the server component runs as the root user. This means it can do all kinds of horrible things. So again, don't use this on a production system or any system tied into phone lines.

YOU HAVE BEEN WARNED

### Major Caveat 2: Crappy Code

I've been out of the day-to-day development biz for a while. My code is crappy. Feel free to fork, fix, and PR if you think this might turn out to be a useful thing some day.

### Installation

I've been running it out of:
  
    /opt/asteroid
    
You're welcome to put it elsewhere. If you do, you will have to edit the code. (This is very early stuff.) You will need to generate a new set of keys for the web server and place them in the sslcert directory:

    cd /opt/asteroid/sslcert
    openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
    
You'll want to then edit the configuration file and set your passphrase (unless you want to have to type it every time you fire up the server).

    vi /etc/asterisk/asteroid.conf
    
    exports.passphrase="your pass phrase here";
    
You should now be able to start it. It runs on port 80 by default. If you have other things running on port 80, you'll need to change the code. Ultimately the port assignment should be in the configuration file.

    node asteroid.js

You can also just execute it. The shebang expects node to be available at /usr/bin/node - edit if your node binary is elsewhere.

If you're running Ubuntu or something else that can handle upstart scripts, copy the asteroid.conf file in the scripts folder to /etc/init/ and you should be good to go.
