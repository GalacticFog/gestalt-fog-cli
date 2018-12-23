const cmd = require('./lib/cmd-base');

exports.command = 'scale <command>'
exports.desc = 'Scale resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('scale_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});
