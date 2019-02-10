const gestaltSession = require('../gestalt-session');

exports.configure = function (config) {
    const currentConfig = gestaltSession.getSessionConfig();
    gestaltSession.saveSessionConfig(Object.assign(currentConfig, config));
}
