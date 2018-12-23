const { gestalt } = require('gestalt-fog-sdk');
const ui = require('../lib/gestalt-ui');
const cmd = require('../lib/cmd-base');
exports.command = 'environment' // TODO: environment [name]
exports.desc = 'Describe environment'
exports.builder = {
    raw: {
        description: 'Raw output'
    },
}
exports.handler = cmd.handler(async function (argv) {

    const context = await ui.resolveEnvironment();

    const env = await gestalt.fetchEnvironment(context);

    ui.displayResources(env, argv);

    const vars = await gestalt.fetchEnvironmentVariables(context);

    ui.displayResources(vars, argv);
});