require('yargs')
  // .completion()
  .commandDir('cmds')
  .demandCommand()
  // .version('SNAPSHOT')
  .help()
  .strict()
  .argv;


