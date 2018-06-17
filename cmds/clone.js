exports.command = 'clone <resource>'
exports.desc = 'Clone resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('clone_cmds').commandDir('default_cmds');
}
exports.handler = function (argv) {}

