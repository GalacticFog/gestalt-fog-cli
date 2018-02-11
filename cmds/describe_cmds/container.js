const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui');
const cmd = require('../lib/cmd-base');
exports.command = 'container [name]'
exports.desc = 'Describe container'
exports.builder = {
    all: {
        description: 'Describe containers from all environments'
    },
    org: {
        description: 'Describe containers from all environments in current org'
    },
    fqon: {
        description: 'FQON of org containing container'
    },
    id: {
        description: 'Container ID'
    }
}
exports.handler = cmd.handler(async function (argv) {
    if (argv.fqon || argv.id) {
        // Command mode

        if (!argv.fqon) throw Error("missing argv.fqon");
        if (!argv.id) throw Error("missing argv.id");

        const container = await gestalt.fetchContainer({
            fqon: argv.fqon,
            id: argv.id
        });

        doShowContainer(container, argv);
    } else {
        // Interactive mode

        const containerName = argv.name

        let containers = null;
        let context = null;

        if (argv.all) {
            const fqons = await gestalt.fetchOrgFqons();
            containers = await gestalt.fetchOrgContainers(fqons);
        } else if (argv.org) {
            context = await ui.resolveWorkspace();
            containers = await gestalt.fetchOrgContainers([context.org.fqon]);
        } else {
            context = await ui.resolveEnvironment();
            containers = await gestalt.fetchEnvironmentContainers(context);
        }

        if (containers.length == 0) {
            console.log('No containers in current context.');
            return;
        }

        const container = await ui.selectContainer({ name: containerName }, containers);
        if (!container) {
            console.error(`No container '${containerName}' found in the current envrionment.`);
        } else if (argv.raw) {
            console.log(JSON.stringify(container, null, 2));
        } else {

            doShowContainer(container, argv);

            console.log(`Use '--raw' to see raw JSON output`);
            console.log();
        }
    }
});

function showContainer(c) {
    ui.displayResources([c]);

    const options = {
        message: "Instances",
        headers: ['Container Instances', 'Host', 'Addresses', 'Ports', 'Started'],
        fields: ['id', 'host', 'ipAddresses', 'ports', 'startedAt'],
        sortField: 'description',
    }

    ui.displayResource(options, c.properties.instances);
}


function doShowContainer(container, argv) {
    if (argv.raw) {
        console.log(JSON.stringify(container, null, 2));
    } else {
        showContainer(container);

        console.log(`Use '--raw' to see raw JSON output`);
        console.log();
        console.log('Run the following to see this container directly:')
        console.log();
        console.log(`    ${argv['$0']} ${argv._[0]} ${argv._[1]} --fqon ${container.org.properties.fqon} --id ${container.id}`);
        console.log();
    }
}
