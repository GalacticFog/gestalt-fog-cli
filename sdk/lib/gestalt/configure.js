const gestaltContext = require('../gestalt-context');

exports.configure = function (config) {
    const currentConfig = gestaltContext.getConfig();
    gestaltContext.saveConfig(Object.assign(currentConfig, config));
}
