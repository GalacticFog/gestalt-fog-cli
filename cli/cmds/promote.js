const cmd = require('./lib/cmd-base');

exports.command = 'promote <command>'
exports.desc = 'Promote resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('promote_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});
