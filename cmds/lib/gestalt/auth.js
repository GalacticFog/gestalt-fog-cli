const request = require('request-promise-native');
const gestaltContext = require('../gestalt-context');
const querystring = require('querystring');
const { isJsonString } = require('../helpers')
const { debug } = require('../debug');

exports.authenticate = (creds, callback) => {//(username, password) => {
    const security_url = gestaltContext.getConfig()['gestalt_url'] + '/security';
    const url = '/root/oauth/issue';

    const username = creds['username'];
    const password = creds['password'];

    if (!username) throw Error("Username missing from creds");
    if (!password) throw Error("Password missing from creds");

    const postData = querystring.stringify({
        grant_type: "password",
        username: username,
        password: password
    });

    debug(`${security_url}${url}`);
    debug(postData)

    const res = request({
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        },

        body: postData,
        method: 'POST',
        uri: `${security_url}${url}`
    }).then(body => {
        const auth = JSON.parse(body); // JSON.parse(String(res.getBody()));

        debug('Response:');
        debug(auth);

        // Enhance payload with username
        auth.username = username;

        const contents = `${JSON.stringify(auth, null, 2)}\n`;

        gestaltContext.saveAuthToken(contents);

        callback(null, { username: username });
    }).catch(res => {
        if (res.response && res.response.body) {
            const error = res.response.body;

            isJsonString(error)
                ? callback(JSON.parse(error))
                : callback(error);
        } else {
            callback(res);
        }
    });
};