const cmd = require('./lib/cmd-base');

exports.command = 'config <command>'
exports.desc = 'Config commands'
exports.builder = function (yargs) {
  return yargs.commandDir('config_cmds')
}
exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

