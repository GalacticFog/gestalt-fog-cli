const cmd = require('./lib/cmd-base');

exports.command = 'admin <command>'
exports.desc = 'Admin commands'
exports.builder = function (yargs) {
  return yargs.commandDir('admin_cmds')
}
exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

