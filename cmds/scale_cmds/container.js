const cmd = require('../lib/cmd-base');
exports.command = 'container'
exports.desc = 'Scale container'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const gestalt = require('../lib/gestalt')
    const displayResource = require('../lib/displayResourceUI');
    const selectResource = require('../lib/selectResourceUI');
    const selectHierarchy = require('../lib/selectHierarchy');
    const inquirer = require('inquirer');

    // Main
    if (argv.fqon || argv.id || argv.instances) {
        // Command mode

        if (!argv.fqon) throw Error("missing argv.fqon");
        if (!argv.id) throw Error("missing argv.id");
        if (!argv.instances) throw Error("missing argv.instances");

        const num_instances = argv.instances;

        if (!validate(num_instances)) {
            return;
        }

        const container = await gestalt.fetchContainer({ fqon: argv.fqon, id: argv.id });
        container.properties.num_instances = num_instances;
        await gestalt.updateContainer(container);
        console.log('done.');

    } else {

        const container = await selectContainer();
        const num_instances = await getUserInput();
        // Validate input
        if (!validate(num_instances)) {
            return;
        }

        // Confirmation step
        if (await confirmIfNeeded(num_instances)) {
            // Scale up
            container.properties.num_instances = num_instances;
            const c = await gestalt.updateContainer(container);
            console.log("Done.");
            console.log();
            console.log(`The following command may be run to scale the container directly:`);
            console.log();
            console.log(`    ${argv['$0']} ${argv._[0]} ${argv._[1]} --fqon ${container.org.properties.fqon} --id ${container.id} --instances ${num_instances}`);
            console.log();
        } else {
            console.log("Aborted");
        }
    }

    function validate(num_instances) {
        if (!num_instances) {
            console.log(`Invalid input: num_instances is '${num_instances}', aborting.`);
            return false;
        }
        if (!Number.isInteger(Number(num_instances))) {
            console.log(`Invalid input: '${num_instances}' is not an integer, aborting.`);
            return false;
        }
        if (num_instances < 0) {
            console.log(`Invalid input: num_instances is '${num_instances}', aborting.`);
            return false;
        }
        return true;
    }

    async function selectContainer() {

        await selectHierarchy.resolveEnvironment();

        const res = await gestalt.fetchContainers();

        let options = {
            mode: 'autocomplete',
            message: "Select Container(s)",
            fields: ['name', 'properties.status', 'properties.image', 'properties.num_instances', 'owner.name', 'properties.provider.name'],
            sortBy: 'name',
            resources: res
        }

        return selectResource.run(options);
    }

    function getUserInput() {
        const questions = [
            {
                message: "Number of instances",
                type: 'input',
                name: 'num_instances',
            },
        ];

        return inquirer.prompt(questions).then(answers => answers.num_instances);
    }

    function confirmIfNeeded(num_instances) {
        if (num_instances > 10) {
            const questions = [
                {
                    message: `Scaling to ${num_instances}, are you sure?`,
                    type: 'confirm',
                    name: 'confirm',
                    default: false
                },
            ];

            return inquirer.prompt(questions).then(answers => answers.confirm);
        } else {
            // No need for confirmation
            return new Promise(resolve => resolve(true));
        }
    }
});