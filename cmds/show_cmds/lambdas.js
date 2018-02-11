const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'lambdas'
exports.desc = 'List lambdas'
exports.builder = {
    all: {
        description: 'Display all lambdas in all orgs'
    },
    org: {
        description: 'Display all lambdas in the current org'
    }
}

exports.handler = cmd.handler(async function (argv) {
    if (argv.all) {
        let fqons = await gestalt.fetchOrgFqons();
        let resources = await gestalt.fetchOrgLambdas(fqons);
        ui.displayResources(resources, argv, {});
    } else if (argv.org) {
        const context = await ui.resolveOrg(false);
        const resources = await gestalt.fetchOrgLambdas([context.org.fqon]);
        ui.displayResources(resources, argv, context);
    } else {
        const context = await ui.resolveEnvironment(false);
        const resources = await gestalt.fetchEnvironmentLambdas(context);
        ui.displayResources(resources, argv, context);
    }
});
