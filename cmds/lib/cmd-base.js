const fs = require('fs');
const yaml = require('js-yaml');
const chalk = require('chalk');
const { debug } = require('./debug');
const contextResolver = require('./context-resolver');

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

//TODO: Move to utils
function loadObjectFromFile(filePath) {
  if (fs.existsSync(filePath)) {
    const contents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(contents);
  }

  throw new Error(`File '${filePath}' not found`);
}

//TODO: Move to utils
function loadYAMLFromFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      return yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      throw new Error(`Error reading '${filePath}'`);
    }

  }

  throw new Error(`File '${filePath}' not found`);
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


module.exports = {
  ...contextResolver,
  debug,
  loadObjectFromFile,
  loadYAMLFromFile,
  handler,
  // resolveProvider,
  // resolveOrg,
  // resolveWorkspace,
  // resolveEnvironment,
  // resolveEnvironmentApi,
  // resolveEnvironmentContainer,
  // resolveEnvironmentLambda,
  // lookupEnvironmentResourcebyName,
  // resolveContextPath,
  // requireArgs
};
