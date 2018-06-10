const inquirer = require('inquirer');
const fs = require('fs');
const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const inputValidation = require('../lib/inputValidation');
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'POST'
exports.desc = 'HTTP functions'
exports.builder = {
    file: {
        alias: 'f',
        description: 'resource definition file'
    },
    scope: {
        alias: 's',
        description: "Scope, e.g. 'root', 'org', 'workspace', 'environment'"
    }
}

exports.handler = cmd.handler(async function (argv) {
    const urlPath = argv._[2];

    if (!argv.file) {
        throw Error('missing --file parameter');
    }

    let context = null;
    let path = null;
    if (!argv.scope) {
        context = { org: { fqon: 'root' } };
        path = '';
    } else {
    switch (argv.scope) {
        case 'org':
            context = cmd.resolveOrg(argv);
            path = `/${context.org.fqon}`;
            break;
        case 'workspace':
            context = cmd.resolveWorkspace(argv);
            path = `/${context.org.fqon}/workspaces/${context.workspace.id}`;
            break;
        case 'environment':
            context = cmd.resolveEnvironment(argv);
            path = `/${context.org.fqon}/environments/${context.environment.id}`;
            break;
        default:
            throw Error("Invalid --scope parameter. Valid arguments are 'root', 'org', 'workspace', 'environment'");
    }
    }

    // } else {
    console.log(`Loading resource spec from file ${argv.file}`);
    let spec = cmd.loadObjectFromFile(argv.file);

    // Resolve environment context from command line args
    if (argv.provider) {
        const provider = await cmd.resolveProvider(argv, context);
        spec.properties = spec.properties || {};
        spec.properties.provider = {
            id: provider.id,
            locations: []
        };
    }

    const res = await gestalt.metaPost(path + urlPath, spec);
    console.log(JSON.stringify(res, null, 2));
    // }
});
