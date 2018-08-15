const chalk = require('chalk');
const { debug } = require('./debug');
const contextResolver = require('./context-resolver');
const util = require('./util');

module.exports = {
  ...contextResolver,
  ...util,
  debug,
  handler
};

function handler(main) {
  return function (argv) {
    if (argv.insecure) {
      console.log('Insecure mode: Ignoring TLS to allow self-signed certificates');
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    global.fog = global.fog || {};
    if (argv.debug) global.fog.debug = true;

    run(main, argv).then(() => {
      // Post
    });
  };
}

function handleError(argv, err) {
  // Write error to screen
  console.error(chalk.red(err));

  // Debug output
  debug(err);
}

async function run(fn, argv) {
  try {
    await fn(argv);
  } catch (err) {
    handleError(argv, err);

    //eslint-disable-next-line no-process-exit
    process.exit(-1);
  }
}
