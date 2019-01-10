'use strict';
const { debug } = require('./debug');
const contextResolver = require('./context-resolver');
const util = require('./util');
const { gestaltContext } = require('gestalt-fog-sdk');
const chalk = require('./chalk');

module.exports = {
  ...contextResolver,
  ...util,
  debug,
  handler
};

function handler(main) {
  return function (argv) {

    initialize(argv);

    run(main, argv).then(() => {
      // Post
    });
  };
}

function initialize(argv) {
  const config = gestaltContext.getConfig();

  // Setup Logging
  global.fog = global.fog || {};
  if (config['debug'] == 'true') {
    global.fog.debug = true
    debug('Debug enabled via configuration');
  } else if (argv.debug) {
    global.fog.debug = true;
    debug('Debug enabled via --debug flag');
  }

  // Setup insecure TLS
  if (config['insecure'] || argv.insecure) {
    console.error(chalk.yellow('Warning: Using Insecure mode - Ignoring TLS to allow self-signed certificates'));
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

async function run(fn, argv) {
  try {
    await fn(argv);
  } catch (err) {
    // Write error to screen
    console.error(chalk.red(err));

    // Debug output
    debug(err.stack);

    //eslint-disable-next-line no-process-exit
    process.exit(-1);
  }
}
