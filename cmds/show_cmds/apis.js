const gestalt = require('../lib/gestalt');
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'apis'
exports.desc = 'List APIs'
exports.builder = {
    all: {
        description: 'Display all apis in all orgs'
    },
    org: {
        description: 'Display all apis in the current org'
    },
    raw: {
        description: 'Show in raw JSON format'
    }
}

exports.handler = cmd.handler(async function (argv) {
    if (argv.all) {
        let fqons = await gestalt.fetchOrgFqons();
        const apis = await gestalt.fetchOrgApis(fqons);
        ui.displayResources(apis, argv);
    } else if (argv.org) {
        const context = await ui.resolveOrg(false);
        const apis = await gestalt.fetchOrgApis([context.org.fqon]);
        ui.displayResources(apis, argv, context);
    } else {
        const context = await ui.resolveEnvironment(false);
        const apis = await gestalt.fetchEnvironmentApis(context);
        ui.displayResources(apis, argv, context);
    }
});
