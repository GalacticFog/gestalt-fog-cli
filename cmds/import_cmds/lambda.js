const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const io = require('../lib/gestalt-io');
const cmd = require('../lib/cmd-base');

exports.command = 'lambda'
exports.desc = 'Import lambda'
exports.builder = {
}

exports.handler = cmd.handler(async function (argv) {
    const context = await ui.resolveEnvironment();
    const lambda = io.loadResourceFromFile(argv.file);
        
    gestalt.createLambda(lambda, context);
});
