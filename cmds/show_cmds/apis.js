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

const options = {
    message: "APIs",
    headers: [
        'Name',
        'FQON',
        'Owner',
        'ID'
    ],
    fields: [
        'name',
        'org.properties.fqon',
        'owner.name',
        'id'
    ],
    sortField: 'description',
}

exports.handler = cmd.handler(async function (argv) {
    if (argv.all) {
        let fqons = await gestalt.fetchOrgFqons();
        const apis = await gestalt.fetchOrgApis(fqons);
        displayApis(argv, apis);
    } else if (argv.org) {
        const state = await ui.resolveOrg();
        const apis = await gestalt.fetchOrgApis([state.org.fqon]);
        displayApis(argv, apis);
    } else {
        const state = await ui.resolveEnvironment();
        const apis = await gestalt.fetchEnvironmentApis(state);
        displayApis(argv, apis);
    }
});

function displayApis(argv, apis) {
    if (argv.raw) {
        console.log(JSON.stringify(apis, null, 2));
    } else {
        ui.displayResource(options, apis);
    }
}
