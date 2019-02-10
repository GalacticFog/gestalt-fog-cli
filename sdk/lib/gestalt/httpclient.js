const request = require('request-promise-native');
const { debug } = require('../debug');
const gestaltSession = require('../gestalt-session');

// Exports

module.exports = {
    httpGet,
    httpPut,
    httpPost,
    httpPatch,
    httpDelete
}

async function httpGet(url, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    options.method = 'GET';
    options.uri = url;
    debug(`${options.method} ${options.uri}`);
    const res = await request(options);
    return JSON.parse(res);
}

async function httpPost(url, body, opts) {
    return httpRequest('POST', url, body, opts);
}

async function httpPut(url, body, opts) {
    return httpRequest('PUT', url, body, opts);
}

async function httpDelete(url, body, opts) {
    return httpRequest('DELETE', url, body, opts);
}

async function httpPatch(url, body, opts) {
    return httpRequest('PATCH', url, body, opts);
}

async function httpRequest(method, url, body, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    options.json = body;
    options.method = method;
    options.uri = url;
    debug(`${options.method} ${options.uri}`);
    debug(body);
    const res = await request(options);
    return res;
}

function getCachedAuthToken() {
    return gestaltSession.getCachedAuthToken();
}
