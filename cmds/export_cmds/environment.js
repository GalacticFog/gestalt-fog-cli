const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const io = require('../lib/gestalt-io');
const cmd = require('../lib/cmd-base');
const doExport = require('./exportHelper').doExport;

exports.command = 'environment'
exports.desc = 'Export environment'
exports.builder = {
}

exports.handler = cmd.handler(async function (argv) {
    const context = await ui.resolveEnvironment();
    const environment = await gestalt.fetchEnvironment(context);
    let types = gestalt.getEnvironmentResourceTypes();
    if (!argv.all) {
        types = await ui.selectOptions('Resources to export', types);
    }
    await doExport([], [environment], types, argv.path);

    // const resources = {};
    // for (let type of types) {
    //     const res = await gestalt.fetchEnvironmentResources(type, context);
    //     resources[type] = res;
    // }

    // io.exportEnvironment(null, environment, resources);
});
