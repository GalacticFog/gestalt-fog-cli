const cmd = require('./lib/cmd-base');

exports.command = 'restart <command>'
exports.desc = 'Restart resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('restart_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});
