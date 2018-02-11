const gestalt = require('../lib/gestalt')
const ui = require('../lib/gestalt-ui')
const io = require('../lib/gestalt-io');
const cmd = require('../lib/cmd-base');

exports.command = 'lambda'
exports.desc = 'Export lambda'
exports.builder = {
}

exports.handler = cmd.handler(async function (argv) {

    const context = await ui.resolveEnvironment();
    const lambdas = await gestalt.fetchEnvironmentLambdas(context);
    const selectedLambda = await ui.selectLambda({}, lambdas);

    io.exportResourceToFile(selectedLambda, argv.file);
});
