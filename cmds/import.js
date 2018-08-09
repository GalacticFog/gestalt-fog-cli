const cmd = require('./lib/cmd-base');

exports.command = 'import <command>'
exports.desc = 'Imports resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('import_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

