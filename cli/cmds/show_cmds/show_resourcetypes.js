const { gestalt } = require('gestalt-fog-sdk')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
const { builder } = require('./lib/genericShowCommandHandler');
exports.command = 'resourcetypes'
exports.desc = 'List resource types'
exports.builder = builder;
exports.handler = cmd.handler(async function (argv) {

    const resources = await gestalt.fetchResourceTypes();
    resources.map(r => {
        r.resource_type = 'Gestalt::Resource::Type';
    })

    ui.displayResources(resources, argv, {});
});
