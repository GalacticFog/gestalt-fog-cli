const meta = require('../lib/gestalt/metaclient');
const cmd = require('../lib/cmd-base');
const { renderResourceTemplate } = require('../lib/template-resolver');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');
const contextResolver = require('../lib/context-resolver');

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

    const context = await contextResolver.resolveContextFromProviderPath(path);

    out(`Loading template from file ${argv.file}`);
    const resourceTemplate = util.loadObjectFromFile(argv.file);

    debug('Resource Template:')
    debug(resourceTemplate);

    const provider = await contextResolver.resolveProviderByPath(path);

    const resourceSpec = await renderResourceTemplate(resourceTemplate, {}, undefined);

    debug('Resource Spec:')
    debug(resourceSpec);

    debug(`Finished processing resource template.`)

    const resource = await meta.PATCH(`/${context.org.fqon}/providers/${provider.id}`, resourceSpec);

    debug(resource);
    out(`Patched provider '${resource.name}' (${resource.resource_type})`);
});
