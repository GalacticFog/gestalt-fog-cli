#!/usr/bin/env node

const gestalt = require('./lib/gestalt');
const gestaltState = require('./lib/gestalt-state');

gestalt.authenticate((err, res) => {
    if (!err) {
        console.log(`Authenticated. User ${res.username} logged in.`);    
    } else {
        console.error("Login failed: " + err);
        console.error();
        console.error("Please check the Gestalt URL endpoint and credentials and try again.")
    }
});

// Clear the current context
gestaltState.clearState();
