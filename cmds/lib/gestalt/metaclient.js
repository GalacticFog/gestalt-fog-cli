const { 
    httpGet,
    httpPut,
    httpPost,
    httpPatch,
    httpDelete } = require('./httpclient');

const gestaltContext = require('../gestalt-context');

module.exports = {
    GET,
    PUT,
    POST,
    DELETE,
    PATCH
};


// Functions

function GET(url, opts) {
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';
    return httpGet(`${meta_url}${url}`, opts);
}

function POST(url, body, opts) {
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';
    return httpPost(`${meta_url}${url}`, body, opts);
}

function PUT(url, body, opts) {
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';
    return httpPut(`${meta_url}${url}`, body, opts);
}

function PATCH(url, body, opts) {
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';
    return httpPatch(`${meta_url}${url}`, body, opts);
}

function DELETE(url, opts) {
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';
    return httpDelete(`${meta_url}${url}`, undefined, opts);
}

function getGestaltConfig() {
    return gestaltContext.getConfig();
}
