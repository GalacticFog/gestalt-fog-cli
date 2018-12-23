const cmd = require('./lib/cmd-base');

exports.command = 'meta <command>'
exports.desc = 'Gestalt Meta functions'
exports.builder = function (yargs) {
  return yargs.commandDir('meta_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

