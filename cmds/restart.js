exports.command = 'restart <resource>'
exports.desc = 'Restart resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('restart_cmds')
}
exports.handler = function (argv) {}

