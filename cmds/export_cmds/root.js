const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const io = require('../lib/gestalt-io');
const cmd = require('../lib/cmd-base');
const doExport = require('./exportHelper').doExport;

exports.command = 'root'
exports.desc = 'Export root'
exports.builder = {
    all: {
        description: 'Export all (no prompts for selection)'
    },
    path: {
        description: 'Export path (default is current directory)'
    }
}

exports.handler = cmd.handler(async function (argv) {

    // Choose Resource Types
    let types = gestalt.getEnvironmentResourceTypes();
    if (!argv.all) {
        types = await ui.selectOptions('Resources to export', types);
    }

    // Select orgs
    let fqons = await gestalt.fetchOrgFqons();
    if (!argv.all) {
        fqons = await ui.selectOptions('Orgs', fqons);
    }

    // Select Workspaces
    let workspaces = await gestalt.fetchOrgWorkspaces(fqons);
    if (!argv.all) {
        workspaces = workspaces.map(ws => {
            return {
                name: `${ws.org.properties.fqon} / ${ws.name}`,
                value: ws
            }
        });
        workspaces = await ui.selectnv({ message: 'Workspaces to export', mode: 'checkbox' }, workspaces);
    }

    // Gather Selection of Environments
    let environments = [];
    for (let ws of workspaces) {
        const wsContext = { org: { fqon: ws.org.properties.fqon }, workspace: { id: ws.id } };
        const envs = (await gestalt.fetchWorkspaceEnvironments(wsContext)).map(env => {
            return {
                name: `${wsContext.org.fqon} / ${ws.name} / ${env.name}`,
                value: env
            }
        });
        environments = environments.concat(envs);
    }

    // Select Environments
    if (argv.all) {
        environments = environments.map(e => e.value);
    } else {
        environments = await ui.selectnv({ message: 'Environments to export', mode: 'checkbox' }, environments);
    }

    await doExport(workspaces, environments, types, argv.path);
});
