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

function getMetaUrl() {
    const config = gestaltContext.getConfig();
    if (config['meta_url']) {
        return config['meta_url']
    }

    if (config['gestalt_url']) {
        return config['gestalt_url'] + '/meta';
    }

    throw Error(`No security URL present in config`)
}

function GET(url, opts) {
    const meta_url = getMetaUrl();
    return httpGet(`${meta_url}${url}`, opts);
}

function POST(url, body, opts) {
    const meta_url = getMetaUrl();
    return httpPost(`${meta_url}${url}`, body, opts);
}

function PUT(url, body, opts) {
    const meta_url = getMetaUrl();
    return httpPut(`${meta_url}${url}`, body, opts);
}

function PATCH(url, body, opts) {
    const meta_url = getMetaUrl();
    return httpPatch(`${meta_url}${url}`, body, opts);
}

function DELETE(url, opts) {
    const meta_url = getMetaUrl();
    return httpDelete(`${meta_url}${url}`, undefined, opts);
}
