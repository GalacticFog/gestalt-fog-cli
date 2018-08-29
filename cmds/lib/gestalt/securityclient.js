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

function GET(url, opts) {
    const baseurl = getGestaltConfig()['gestalt_url'] + '/security';
    return httpGet(`${baseurl}${url}`, opts);
}

function POST(url, body, opts) {
    const baseurl = getGestaltConfig()['gestalt_url'] + '/security';
    return httpPost(`${baseurl}${url}`, body, opts);
}

function PUT(url, body, opts) {
    const baseurl = getGestaltConfig()['gestalt_url'] + '/security';
    return httpPut(`${baseurl}${url}`, body, opts);
}

function PATCH(url, body, opts) {
    const baseurl = getGestaltConfig()['gestalt_url'] + '/security';
    return httpPatch(`${baseurl}${url}`, body, opts);
}

function DELETE(url, opts) {
    const baseurl = getGestaltConfig()['gestalt_url'] + '/security';
    return httpDelete(`${baseurl}${url}`, undefined, opts);
}

function getGestaltConfig() {
    return gestaltContext.getConfig();
}
