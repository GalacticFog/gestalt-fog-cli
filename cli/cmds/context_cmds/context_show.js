const cmd = require('../lib/cmd-base');
const gestaltContext = require('../lib/gestalt-context');
const ui = require('../lib/gestalt-ui')

exports.command = 'show'
exports.desc = 'Shows the current context'
exports.builder = {
    raw: {
        description: "Shows raw context path"
    }
}
exports.handler = cmd.handler(async function (argv) {
    const context = gestaltContext.getContext();
    console.log(ui.getContextString(context, argv));
});

