exports.command = 'switch <resource>'
exports.desc = 'Switch to resource of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('switch_cmds')
}
exports.handler = function (argv) {}

