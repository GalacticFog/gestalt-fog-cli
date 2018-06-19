const gestalt = require('../lib/gestalt');
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'api-endpoints'
exports.desc = 'List API endpoints'
exports.builder = {
    all: {
        description: 'Display all api endpoints in all orgs'
    },
    org: {
        description: 'Display all api endpoints in the current org'
    },
    raw: {
        description: 'Show in raw JSON format'
    }
}

exports.handler = cmd.handler(async function (argv) {
    if (argv.all) {
        await showAllApiEndpoints(argv);
    } else if (argv.org) {
        await showOrgApiEndpoints(argv)
    } else {
        await showApiEndpoints(argv);
    }
});

async function showApiEndpoints(argv) {
    const context = await ui.resolveEnvironment(false);
    const resources = await gestalt.fetchEnvironmentApis(context);
    const apis = resources.map(item => {
        return {
            id: item.id,
            fqon: item.org.properties.fqon
        }
    });

    const wsName = context.workspace.name;
    const envName = context.environment.name;

    const eps = await gestalt.fetchApiEndpoints(apis);
    eps.map(ep => {
        ep.properties.api_path = `/${ep.properties.parent.name}${ep.properties.resource}`
        ep.properties.environment = envName;
        ep.properties.workspace = wsName;
    });

    ui.displayResources(eps, argv, context);
}

async function showOrgApiEndpoints(argv) {
    const context = await ui.resolveOrg(false);
    const resources = await gestalt.fetchOrgApis([context.org.fqon]);
    const apis = resources.map(item => {
        return {
            id: item.id,
            fqon: item.org.properties.fqon
        }
    });
    const eps = await gestalt.fetchApiEndpoints(apis);
    eps.map(ep => {
        ep.properties.api_path = `/${ep.properties.parent.name}${ep.properties.resource}`
        ep.properties.environment = '(empty)';
        ep.properties.workspace = '(empty)';
    });

    ui.displayResources(eps, argv, context);
}

async function showAllApiEndpoints(argv) {
    let fqons = await gestalt.fetchOrgFqons();
    let resources = await gestalt.fetchOrgApis(fqons);
    const apis = resources.map(item => {
        return {
            id: item.id,
            fqon: item.org.properties.fqon
        }
    });

    const eps = await gestalt.fetchApiEndpoints(apis);
    for (let ep of eps) {
        ep.properties.api_path = `/${ep.properties.parent.name}${ep.properties.resource}`
        //     ep.properties.environment = '(empty)';
        //     ep.properties.workspace = '(empty)';
    }

    ui.displayResources(eps, argv);
}