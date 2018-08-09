const cmd = require('./lib/cmd-base');

exports.command = 'clone <command>'
exports.desc = 'Clone resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('clone_cmds')
}
exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});
