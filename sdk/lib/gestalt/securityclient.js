const { 
    httpGet,
    httpPut,
    httpPost,
    httpPatch,
    httpDelete } = require('./httpclient');

    // Gestalt stuff
const gestaltContext = require('../gestalt-context');

// Exports
module.exports = {
    GET,
    PUT,
    POST,
    PATCH,
    DELETE
}

// Functions

function getSecurityUrl() {
    const config = gestaltContext.getConfig();
    if (config['security_url']) {
        return config['security_url']
    }

    if (config['gestalt_url']) {
        return config['gestalt_url'] + '/security';
    }

    throw Error(`No security URL present in config`)
}


function GET(url, opts) {
    const baseurl = getSecurityUrl();
    return httpGet(`${baseurl}${url}`, opts);
}

function POST(url, body, opts) {
    const baseurl = getSecurityUrl();
    return httpPost(`${baseurl}${url}`, body, opts);
}

function PUT(url, body, opts) {
    const baseurl = getSecurityUrl();
    return httpPut(`${baseurl}${url}`, body, opts);
}

function PATCH(url, body, opts) {
    const baseurl = getSecurityUrl();
    return httpPatch(`${baseurl}${url}`, body, opts);
}

function DELETE(url, opts) {
    const baseurl = getSecurityUrl();
    return httpDelete(`${baseurl}${url}`, undefined, opts);
}
