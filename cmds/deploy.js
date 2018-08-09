const cmd = require('./lib/cmd-base');

exports.command = 'deploy <command>'
exports.desc = 'Deploys resources of specified type'
exports.builder = function (yargs) {
  return yargs.commandDir('deploy_cmds')
}

exports.handler = cmd.handler(async function (argv) {
  throw Error(`Unrecognized command: '${argv.command}'`)
});
