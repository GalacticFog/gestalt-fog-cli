const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');
const util = require('../lib/util');
const yaml = require('js-yaml');

exports.command = 'unset [args...]'
exports.desc = 'Unset config'
exports.builder = {
    all: {
        description: 'Resets all configuration settings'
    }
}
exports.handler = cmd.handler(async function (argv) {
    const config = gestaltContext.getConfig();

    if (argv.all) {
        // Clear everything except url and username
        gestaltContext.saveConfig({
            gestalt_url: config.gestalt_url,
            username: config.username
        });
    } else {
        const args = argv.args;
        if (args) {
            // Apply config
            for (let a of args) {
                delete config[a];
            }
            gestaltContext.saveConfig(config);
        } else {
            throw Error('No args specified - nothing to do.');
        }
    }

    console.log(yaml.dump({ 'Configuration Settings': gestaltContext.getConfig() }));
});
