require('yargs')
  // .completion()
  .commandDir('cmds')
  .demandCommand()
  .help()
  // .version('SNAPSHOT')
  .argv;
