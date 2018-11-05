const cmd = require('./lib/cmd-base');

exports.command = 'completion <command>'
exports.desc = 'Shell completion commands'
exports.builder = function (yargs) {
  return yargs.commandDir('completion_cmds')
}
exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

