const cmd = require('./lib/cmd-base');

module.exports = {
  command: 'service <command>',
  desc: 'service resources of specified type',
  builder: (yargs) => {
    return yargs.commandDir('service_cmds')
  },
  handler: cmd.handler(async (argv) => {
    throw Error(`Unrecognized command: '${argv.command}'`)
  }),
}
