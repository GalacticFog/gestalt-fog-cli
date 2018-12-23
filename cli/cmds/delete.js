const cmd = require('./lib/cmd-base');

exports.command = 'delete <command>'
exports.desc = 'Delete resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('delete_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});
