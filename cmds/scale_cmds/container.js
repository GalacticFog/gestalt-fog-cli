exports.command = 'container'
exports.desc = 'Scale container'
exports.builder = {}
exports.handler = function (argv) {
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

        gestalt.fetchContainer({ fqon: argv.fqon, id: argv.id }).then(container => {
            container.properties.num_instances = num_instances;
            gestalt.updateContainer(container).then(result => {
                console.log('done.');
            });
        });
    } else {

        selectContainer(container => {
            getUserInput(num_instances => {
                // Validate input
                if (!validate(num_instances)) {
                    return;
                }

                // Confirmation step
                confirmIfNeeded(num_instances, (confirm) => {
                    if (confirm) {
                        // Scale up
                        container.properties.num_instances = num_instances;
                        gestalt.updateContainer(container).then(c => {
                            console.log("Done.");
                            console.log();
                            console.log(`The following command may be run to scale the container directly:`);
                            console.log();
                            console.log(`    ./${argv['$0']} --fqon ${container.org.properties.fqon} --id ${container.id} --instances ${num_instances}`);
                            console.log();
                        });
                    } else {
                        console.log("Aborted");
                    }
                });
            });
        });
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

    function selectContainer(callback) {

        selectHierarchy.resolveEnvironment().then(() => {

            gestalt.fetchContainers().then(res => {

                let options = {
                    mode: 'autocomplete',
                    message: "Select Container(s)",
                    fields: ['name', 'properties.status', 'properties.image', 'properties.num_instances', 'owner.name', 'properties.provider.name'],
                    sortBy: 'name',
                    fetchFunction: () => {
                        return res;
                    }
                }

                selectResource.run(options, selection => {
                    if (callback) callback(selection);
                });
            });
        });
    }

    function getUserInput(callback) {
        const questions = [
            {
                message: "Number of instances",
                type: 'input',
                name: 'num_instances',
            },
        ];

        inquirer.prompt(questions).then(answers => {
            callback(answers.num_instances);
        });
    }

    function confirmIfNeeded(num_instances, callback) {
        if (num_instances > 10) {
            const questions = [
                {
                    message: `Scaling to ${num_instances}, are you sure?`,
                    type: 'confirm',
                    name: 'confirm',
                    default: false
                },
            ];

            inquirer.prompt(questions).then(answers => {
                callback(answers.confirm);
            });
        } else {
            // No need for confirmation
            callback(true);
        }
    }
}