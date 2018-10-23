const cmd = require('./lib/cmd-base');

exports.command = 'migrate <command>'
exports.desc = 'Migrate resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('migrate_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});
