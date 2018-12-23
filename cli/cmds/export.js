const cmd = require('./lib/cmd-base');

exports.command = 'export <command>'
exports.desc = 'Exports resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('export_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

