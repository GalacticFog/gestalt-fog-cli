exports.command = 'context <command>'
exports.desc = 'Context commands'
exports.builder = function (yargs) {
  return yargs.commandDir('context_cmds')
}
exports.handler = function (argv) {}

