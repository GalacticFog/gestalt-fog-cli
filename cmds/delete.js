exports.command = 'delete <resource>'
exports.desc = 'Delete resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('delete_cmds')
}
exports.handler = function (argv) {}

