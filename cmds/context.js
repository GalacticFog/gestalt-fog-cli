const cmd = require('./lib/cmd-base');

exports.command = 'context <command>'
exports.desc = 'Context commands'
exports.builder = function (yargs) {
  return yargs.commandDir('context_cmds')
}
exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

