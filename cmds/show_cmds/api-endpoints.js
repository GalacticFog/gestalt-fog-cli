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
        showAllApiEndpoints(argv);
    } else if (argv.org) {
        showOrgApiEndpoints(argv)
    } else {
        showApiEndpoints(argv);
    }
});

async function showApiEndpoints(argv) {
    const options = {
        message: "API Endpoints",
        headers: [
            'Resource Patch',
            'Type',
            'Security',
            'FQON',
            'Workspace',
            'Environment',
            'Synchronous',
            'Methods',
            'Owner'
        ],
        fields: [
            'properties.api_path',
            'properties.implementation_type',
            'properties.plugins.gestaltSecurity.enabled',
            'org.properties.fqon',
            'properties.workspace',
            'properties.environment',
            'properties.synchronous',
            'properties.methods',
            'owner.name'
        ],
        sortField: 'description',
    }

    const state = await ui.resolveEnvironment();
    const resources = await gestalt.fetchEnvironmentApis(state);
    const apis = resources.map(item => {
        return {
            id: item.id,
            fqon: item.org.properties.fqon
        }
    });

    const wsName = state.workspace.name;
    const envName = state.environment.name;

    const eps = await gestalt.fetchApiEndpoints(apis);
    eps.map(ep => {
        ep.properties.api_path = `/${ep.properties.parent.name}${ep.properties.resource}`
        ep.properties.environment = envName;
        ep.properties.workspace = wsName;
    });

    if (argv.raw) {
        console.log(JSON.stringify(eps, null, 2));
    } else {
        ui.displayResource(options, eps);
    }
}

async function showOrgApiEndpoints(argv) {

    const options = {
        message: "API Endpoints",
        headers: [
            'Resource Path',
            'Type',
            'Security',
            'FQON',
            // 'Workspace',
            // 'Environment',
            'Synchronous',
            'Methods',
            'Owner'
        ],
        fields: [
            'properties.api_path',
            'properties.implementation_type',
            'properties.plugins.gestaltSecurity.enabled',
            'org.properties.fqon',
            // 'properties.workspace',
            // 'properties.environment',
            'properties.synchronous',
            'properties.methods',
            'owner.name'
        ],
        sortField: 'description',
    }

    const state = await ui.resolveOrg();

    const resources = await gestalt.fetchOrgApis([state.org.fqon]);

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

    if (argv.raw) {
        console.log(JSON.stringify(eps, null, 2));
    } else {
        ui.displayResource(options, eps);
    }
}

async function showAllApiEndpoints(argv) {

    const options = {
        message: "API Endpoints",
        headers: [
            'Resource Path',
            'Type',
            'Security',
            'FQON',
            // 'Workspace',
            // 'Environment',
            'Synchronous',
            'Methods',
            'Owner'
        ],
        fields: [
            'properties.api_path',
            'properties.implementation_type',
            'properties.plugins.gestaltSecurity.enabled',
            'org.properties.fqon',
            // 'properties.workspace',
            // 'properties.environment',
            'properties.synchronous',
            'properties.methods',
            'owner.name'
        ],
        sortField: 'description',
    }

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

    if (argv.raw) {
        console.log(JSON.stringify(eps, null, 2));
    } else {
        ui.displayResource(options, eps);
    }
}