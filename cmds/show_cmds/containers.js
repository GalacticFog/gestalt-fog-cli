const gestalt = require('../lib/gestalt')
const displayResource = require('../lib/displayResourceUI');
const selectHierarchy = require('../lib/selectHierarchy');

const cmd = require('../lib/cmd-base');
exports.command = 'containers'
exports.desc = 'List containers'
exports.builder = {
    all: {
        description: 'Display all containers in all orgs'
    },
    org: {
        description: 'Display all containers in the current org'
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
    await selectHierarchy.resolveEnvironment();
    const containers = await gestalt.fetchContainers();
    displayContainers(containers);
}

async function showAllContainers(argv) {
    const fqons = await gestalt.fetchOrgFqons();
    let containers = await gestalt.fetchOrgContainers(fqons);
    displayContainers(containers);
}

async function showOrgContainers(argv) {
    await selectHierarchy.resolveOrg();
    const fqon = gestalt.getCurrentOrg().fqon;
    const containers = await gestalt.fetchOrgContainers();
    displayContainers(containers);
}

function displayContainers(containers) {
    const options = {
        message: "Containers",
        headers: ['Container', 'Description', 'Status', 'Image', 'Instances', 'Owner', 'FQON', 'ENV'],
        fields: ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name', 'org.properties.fqon', 'environment.name'],
        sortField: 'org.properties.fqon',
    }

    // Transform for display
    for (let item of containers) {
        if (item.description) {
            if (item.description.length > 20) {
                item.description = item.description.substring(0, 20) + '...';
            }
        }
        // item.fqon = fqon;
        item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`;
    }

    displayResource.run(options, containers);
}
