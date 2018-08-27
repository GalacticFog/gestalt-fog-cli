// const showCommandBuilder = require('./lib/genericShowCommandHandler');
// module.exports = showCommandBuilder.buildCommand('containers');


const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'containers'
exports.desc = 'List containers'
exports.builder = {
    all: {
        description: 'Display all containers in all orgs'
    },
    org: {
        description: 'Display all containers in the current org'
    },
    raw: {
        description: 'Display raw JSON output'
    }
}
exports.handler = cmd.handler(async function (argv) {
    if (argv.all) {
        showAllContainers(argv);
    } else if (argv.org) {
        showOrgContainers(argv);
    } else {
        showContainers(argv);
    }
});

async function showContainers(argv) {
    const context = await ui.resolveEnvironment(false);
    const containers = await gestalt.fetchEnvironmentContainers(context);
    ui.displayResources(containers, argv, context);
}

async function showAllContainers(argv) {
    const fqons = await gestalt.fetchOrgFqons();
    let containers = await gestalt.fetchOrgContainers(fqons);
    ui.displayResources(containers, argv);
}

async function showOrgContainers(argv) {
    const context = await ui.resolveOrg(false);
    const fqon = context.org.fqon;
    const containers = await gestalt.fetchOrgContainers([fqon]);
    ui.displayResources(containers, argv, context);
}
