exports.command = 'restart-containers'
exports.desc = 'Restart containers'
exports.builder = {}
exports.handler = function (argv) {
    const gestalt = require('./lib/gestalt')
    const displayResource = require('./lib/displayResourceUI');
    const selectContainer = require('./lib/selectContainer');
    const selectHierarchy = require('./lib/selectHierarchy');

    // Main
    try {
        selectHierarchy.resolveEnvironment(() => {
            // 1) Select Container2
            selectContainer.run({ mode: 'checkbox', defaultChecked: false }, (selectedContainers) => {
                selectedContainers.map(container => {
                    console.log(`Restarting container ${container.name}`);

                    // remember scale value
                    let instances = container.properties.num_instances;

                    // Scale down
                    container.properties.num_instances = 0;
                    gestalt.updateContainer(container);

                    // Scale up
                    container.properties.num_instances = instances;
                    gestalt.updateContainer(container);
                });
                console.log("Done.");
            });
        });
    } catch (err) {
        console.log(err.message);
        console.log("Try running 'change-context'");
        console.log();
    }
}