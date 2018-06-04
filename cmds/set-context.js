const cmd = require('./lib/cmd-base');

exports.command = 'set-context'
exports.desc = 'Set context'
exports.builder = {}
exports.handler = cmd.handler(async function (argv) {

    const gestaltContext = require('./lib/gestalt-context');

    const context = await cmd.resolveEnvironment(argv);

    gestaltContext.setContext(context);

    console.log("Current context: ");
    console.log(gestaltContext.getContext());
});