exports.command = 'export <resource>'
exports.desc = 'Exports resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('export_cmds').commandDir('default_cmds');
}
exports.handler = function (argv) {}

