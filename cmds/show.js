exports.command = 'show <resource>'
exports.desc = 'Gets resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('show_cmds')
}
exports.handler = function (argv) {}

