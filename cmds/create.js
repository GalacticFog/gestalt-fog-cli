exports.command = 'create <resource>'
exports.desc = 'Creates resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('create_cmds')
}
exports.handler = function (argv) {}

