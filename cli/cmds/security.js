const cmd = require('./lib/cmd-base');

exports.command = 'security <command>'
exports.desc = 'Gestalt Security functions'
exports.builder = function (yargs) {
  return yargs.commandDir('security_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

