'use strict';
const inquirer = require('inquirer');
const gestaltContext = require('./lib/gestalt-context');
const gestalt = require('./lib/gestalt');
const chalk = require('./lib/chalk');
const cmd = require('./lib/cmd-base');

module.exports = {
  command: 'login',
  desc: 'Log in to Gestalt Platform Instance',
  builder: {
    url: {
      description: 'Gestalt URL (optional, prompted if not specified)',
    },
    username: {
      alias: 'u',
      description: 'Username (optional, prompted if not specified)',
    },
    password: {
      alias: 'p',
      description: 'Password (optional, prompted if not specified)',
    }
  },
  handler: cmd.handler(handler),
};

async function handler(argv) {
  // This function is interactive if any parameters missing

  // URL is passed either as first argument, or as --url parameter
  if (!argv.url && argv._[1]) {
    // eslint-disable-next-line prefer-destructuring
    argv.url = argv._[1];
  }

  const config = gestaltContext.getConfig();
  const questions = [];

  if (!argv.url) questions.push({
    type: 'input',
    name: 'gestalt_url',
    message: "Gestalt URL",
    default: () => {
      return config.gestalt_url || '';
    }
  });

  if (!argv.username) questions.push({
    type: 'input',
    name: 'username',
    message: "Username",
    default: () => {
      return config.username || '';
    }
  });

  const answers = await inquirer.prompt(questions);
  const params = {
    gestalt_url: argv.url,
    username: argv.username,
    ...answers,
  };


  if (params.gestalt_url.indexOf("://") == -1) {
    params.gestalt_url = 'https://' + params.gestalt_url;
  }

  gestaltContext.saveConfig(Object.assign(config, params));

  let creds = {
    username: params.username,
    password: argv.password
  };

  if (!creds.password) {
    const questions = [
      {
        type: 'password',
        name: 'password',
        message: "Password",
      },
    ];
    creds = await inquirer.prompt(questions);
    creds.username = params.username;
  }

  doLogin(params.gestalt_url, creds);
}

function doLogin(gestalt_url, creds) {
  gestaltContext.clearAuthToken();
  gestaltContext.clearContext();
  gestaltContext.clearCachedFiles();

  console.log(`Logging in to ${chalk.bold(gestalt_url)}...`);
  gestalt.authenticate(creds, (err, res) => {
    if (!err) {
      console.log(chalk.green(`Authenticated. User ${res.username} logged in to ${gestalt_url}.`));
    } else {
      console.error(chalk.red(`Login failed: ${formatError(err)}\n`));
      console.error('Please check the Gestalt URL endpoint and credentials and try again.');
    }
    // Clear the current context
    gestaltContext.clearContext();
  });
}

function formatError(error) {
  // Gestatlt security currently lacks a meaningful error for "wrong credentials..."
  if (error
    && typeof error === 'object'
    && error.error === 'invalid_grant'
    && error.code === 400) {
    return 'Invalid username or password';
  }

  return error || 'Unknown authentication error';
}
