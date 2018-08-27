const { 
    httpGet,
    httpPut,
    httpPost,
    httpPatch,
    httpDelete } = require('./http-client');

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
    return http_GET(`${baseurl}${url}`, opts);
}

function POST(url, body, opts) {
    const baseurl = getGestaltConfig()['gestalt_url'] + '/security';
    return http_POST(`${baseurl}${url}`, body, opts);
}

function PUT(url, body, opts) {
    const baseurl = getGestaltConfig()['gestalt_url'] + '/security';
    return http_PUT(`${baseurl}${url}`, body, opts);
}

function PATCH(url, body, opts) {
    const baseurl = getGestaltConfig()['gestalt_url'] + '/security';
    return http_PATCH(`${baseurl}${url}`, body, opts);
}

function DELETE(url, opts) {
    const baseurl = getGestaltConfig()['gestalt_url'] + '/security';
    return http_DELETE(`${baseurl}${url}`, undefined, opts);
}

function getGestaltConfig() {
    return gestaltContext.getConfig();
}
