const { 
    httpGet,
} = require('./httpclient');

    // Gestalt stuff
const gestaltSession = require('../gestalt-session');

// Exports
module.exports = {
    fetchLogs
}

// Functions

async function fetchLogs(type, instanceId, options) {
    // http://localhost:31112/log/container/kafka-57fbc6f65f-t4pnj?time=5m&stderr=false
    
    // let queryString = null
    // if (options.time) {
    //     if (!queryString) queryString = '?'
    //     queryString += `time=${options.time}`
    // }
    // if (options.stderr) {

    // }

    const url = getLogsUrl() + `/${type}/${instanceId}`
    return httpGet(url);
}

function getLogsUrl() {
    const config = gestaltSession.getSessionConfig();
    if (config['logs_url']) {
        return config['logs_url']
    }

    if (config['gestalt_url']) {
        return config['gestalt_url'] + '/log';
    }

    throw Error(`No logs URL present in config`)
}
