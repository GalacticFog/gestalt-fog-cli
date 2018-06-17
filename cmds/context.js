exports.command = 'context <command>'
exports.desc = 'Context commands'
exports.builder = function (yargs) {
  return yargs.commandDir('context_cmds').commandDir('default_cmds');
}
exports.handler = function (argv) {}

