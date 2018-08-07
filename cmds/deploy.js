module.exports = {
  command: 'deploy <service>',
  desc: 'Deploy a Service from a service.yml',
  builder: (yargs) => yargs.commandDir('deploy_cmds'),
  handler: () => { },
};
