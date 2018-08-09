const cmd = require('./lib/cmd-base');

exports.command = 'create <command>'
exports.desc = 'Creates resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('create_cmds')
}
exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

