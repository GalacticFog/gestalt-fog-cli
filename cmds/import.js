exports.command = 'import <resource>'
exports.desc = 'Imports resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('import_cmds').commandDir('default_cmds');
}
exports.handler = function (argv) {}

