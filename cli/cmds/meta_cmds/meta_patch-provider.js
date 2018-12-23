const { meta } = require('gestalt-fog-sdk');
const cmd = require('../lib/cmd-base');
const { renderResourceTemplate, contextResolver } = require('gestalt-fog-sdk');
const out = console.log;
const { debug } = require('../lib/debug');

exports.command = 'patch-provider'
exports.desc = 'HTTP functions'
exports.builder = {
    file: {
        alias: 'f',
        description: 'patch definition file',
        required: true
    },

    provider: {
        definition: 'Provider to patch',
        required: true
    }
}

exports.handler = cmd.handler(async function (argv) {

    const path = argv.provider;

    const context = await contextResolver.resolveContextFromResourcePath(path);

    const provider = await contextResolver.resolveProviderByPath(path);

    const resourceSpec = await renderResourceTemplate(argv.file, {}, undefined);

    debug('Resource Spec:')
    debug(resourceSpec);

    debug(`Finished processing resource template.`)

    const resource = await meta.PATCH(`/${context.org.fqon}/providers/${provider.id}`, resourceSpec);

    debug(resource);
    out(`Patched provider '${resource.name}' (${resource.resource_type})`);
});
