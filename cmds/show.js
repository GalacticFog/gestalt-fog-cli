const cmd = require('./lib/cmd-base');

exports.command = 'show <command>'
exports.desc = 'Gets resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('show_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});
