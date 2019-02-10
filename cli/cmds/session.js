const cmd = require('./lib/cmd-base');

exports.command = 'session <command>'
exports.desc = 'Session management commands'
exports.builder = function (yargs) {
  return yargs.commandDir('session_cmds')
}
exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

