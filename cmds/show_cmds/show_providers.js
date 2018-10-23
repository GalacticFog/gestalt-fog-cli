const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const cmd = require('../lib/cmd-base');
exports.command = 'providers'
exports.desc = 'List providers'
exports.builder = {
    type: {
        alias: 't',
        description: 'provider types'
    },
    raw: {
        description: "Raw JSON output"
    },
    path: {
        description: "Specify the context path (/<org>/<workspace>/<environment>)"
    }

}
exports.handler = cmd.handler(async function (argv) {
    let context = null;

    if (argv.path) {
        context = await cmd.resolveContextPath(argv.path);
    } else {
        context = gestalt.getContext();
    }

    if (!context.org) {
        context = await ui.resolveOrg();
        // console.log('No context set, using /root');
        // context = {
        //     org: {
        //         fqon: 'root'
        //     }
        // }
    }

    const resources = await gestalt.fetchProviders(context, argv.type);

    if (argv.raw) {
        console.log(JSON.stringify(resources, null, 2));
    } else {
        ui.displayResources(resources, argv, context);
    }
});