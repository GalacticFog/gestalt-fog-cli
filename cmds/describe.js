exports.command = 'describe <resource>'
exports.desc = 'Describes resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('describe_cmds')
}
exports.handler = function (argv) {}

