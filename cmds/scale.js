exports.command = 'scale <resource>'
exports.desc = 'Scale resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('scale_cmds').commandDir('default_cmds');
}
exports.handler = function (argv) {}

