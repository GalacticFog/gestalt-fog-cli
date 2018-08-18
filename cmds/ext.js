const cmd = require('./lib/cmd-base');

exports.command = 'ext <command>'
exports.desc = false // Hidden
exports.builder = function (yargs) {
  return yargs.commandDir('ext_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});

