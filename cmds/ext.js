exports.command = 'ext <command>'
exports.desc = 'External commands'
exports.builder = function (yargs) {
  return yargs.commandDir('ext_cmds')
}
const cmd = require('./lib/cmd-base');
exports.handler = cmd.handler(async function (argv) {
  cmd.debug(argv);
  throw Error(`Invalid command: '${argv._[0]} ${argv.command}'. Try running 'fog ${argv._[0]} --help'`);
});
