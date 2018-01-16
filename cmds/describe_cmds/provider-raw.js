const cmd = require('../lib/cmd-base');
exports.command = 'provider-raw'
exports.desc = 'Describe provider'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {
    const selectProvider = require('../lib/selectProvider');
    const selectHierarchy = require('../lib/selectHierarchy');

    await selectHierarchy.resolveOrg();

    selectProvider.run({}, provider => {
        console.log()
        console.log(JSON.stringify(provider, null, 2));
        console.log()
    });
});