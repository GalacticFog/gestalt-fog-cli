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
    const options = {
        message: "Containers",
        headers: ['Container', 'Description', 'Status', 'Image', 'Instances', 'Owner'],
        fields: ['name', 'description', 'properties.status', 'properties.image', 'running_instances', 'owner.name'],
        sortField: 'description',
    }

    await selectHierarchy.resolveEnvironment();

    const resources = await gestalt.fetchContainers();
    resources.map(item => {
        item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`
    })

    displayResource.run(options, resources);
}

async function showAllContainers(argv) {


    process.stdout.write('Reading environments');

    const fqons = await gestalt.fetchOrgFqons();
    const envs = await gestalt.fetchOrgEnvironments(fqons);

    let allContainers = [];

    for (let env of envs) {
        process.stdout.write('.');
        const state = {
            org: {
                fqon: env.org.properties.fqon
            },
            environment: {
                id: env.id
            }
        }
        let containers = await gestalt.fetchContainers(state);
        containers.map(item => {
            // TODO
            item.env = { name: env.name };
            item.fqon = env.org.properties.fqon;
            item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`;
            if (item.description) {
                if (item.description.length > 20) {
                    item.description = item.description.substring(0, 20) + '...';
                }
            }
        });
        allContainers = allContainers.concat(containers);
    }

    // Transform for display

    displayContainers(allContainers);
}

async function showOrgContainers(argv) {

    await selectHierarchy.resolveOrg();

    const fqon = gestalt.getCurrentOrg().fqon;

    const envs = await gestalt.fetchOrgEnvironments([fqon]);
    const promises = envs.map(env => {
        console.log(`Fetching containers from ${fqon}/'${env.name}'`);
        const state = {
            org: {
                fqon: fqon
            },
            environment: {
                id: env.id
            }
        }
        return gestalt.fetchContainers(state);
    });

    const arr = await Promise.all(promises);
    const containers = [].concat.apply([], arr);

    containers.map(item => {
        // TODO: How to pass environment
        // item.env = { name: env.name };
        item.fqon = fqon;
        item.running_instances = `${item.properties.tasks_running} / ${item.properties.num_instances}`;
    });

    displayContainers(containers);
}

function displayContainers(containers) {
    const options = {
        message: "Containers",
        headers: ['Container', 'Description', 'Status', /*'Image',*/ 'Instances', 'Owner', 'FQON', 'ENV'],
        fields: ['name', 'description', 'properties.status', /*'properties.image',*/ 'running_instances', 'owner.name', 'org.properties.fqon', 'env.name'],
        sortField: 'org.properties.fqon',
    }

    displayResource.run(options, containers);
}
