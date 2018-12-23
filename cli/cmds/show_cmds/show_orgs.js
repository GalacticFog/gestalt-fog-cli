const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { builder } = require('./lib/genericShowCommandHandler');
exports.command = 'orgs'
exports.desc = 'List orgs'
exports.builder = builder;
exports.handler = cmd.handler(async function (argv) {

    const resources = await gestalt.fetchOrgs();
    resources.map(r => {
        r.fqon = r.properties.fqon; // for sorting
    })

    ui.displayResources(resources, argv, {});
});
