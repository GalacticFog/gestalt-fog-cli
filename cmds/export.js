exports.command = 'export <resource>'
exports.desc = 'Exports resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('export_cmds')
}
const cmd = require('./lib/cmd-base');
exports.handler = cmd.handler(async function (argv) {
  cmd.debug(argv);
  throw Error(`Invalid command: '${argv._[0]} ${argv.resource}'. Try running 'fog ${argv._[0]} --help'`);
});
