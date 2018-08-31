const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');
const yaml = require('js-yaml');

exports.command = 'view'
exports.desc = 'view config'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    // console.log(yaml.dump({ 'Configuration Settings': gestaltContext.getConfig() }));
    console.log(yaml.dump(gestaltContext.getConfig()));

});
