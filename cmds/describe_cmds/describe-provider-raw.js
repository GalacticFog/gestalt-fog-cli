exports.command = 'provider-raw'
exports.desc = 'Describe provider'
exports.builder = {}
exports.handler = function (argv) {
    const selectProvider = require('../lib/selectProvider');
    const selectHierarchy = require('../lib/selectHierarchy');

    function showRaw(obj) {
        console.log()
        console.log(JSON.stringify(obj, null, 2));
        console.log()
    }

    // Main
    try {
        selectHierarchy.resolveOrg(() => {

            // 1) Select Container

            selectProvider.run((provider) => {

                // 2) Show provider details

                showRaw(provider);
            });
        });
    } catch (err) {
        console.log(err.message);
        console.log("Try running 'change-context'");
        console.log();
    }
}