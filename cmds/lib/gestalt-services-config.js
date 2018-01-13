#!/usr/bin/env node
const gestalt = require('./gestalt');
const gestaltState = require('./gestalt-state');
const CONFIG_FILE = 'services-config.json';
const LOCAL_SERVICES_FILE = 'service_configs.local';
const CACHED_SERVICES_FILE = 'service_configs.cached';
const inquirer = require('inquirer');
const chalk = require('chalk');

module.exports = { getServiceConfig, runInteractiveConfigure }

function getServiceConfig(key) {
    // First try .local file
    if (gestaltState.fileExists(LOCAL_SERVICES_FILE)) {
        log(`Using local services config file '${LOCAL_SERVICES_FILE}'`);
        const localConfig = gestaltState.loadConfigFile(LOCAL_SERVICES_FILE);

        // If the local config exists, use it
        if (localConfig['service_configs']) {
            if (localConfig['service_configs'][key]) {
                return localConfig['service_configs'][key];
            }
        }
    }
    // Local file or config didn't exist, get from service discovery
    return getOrFetchConfig()['service_configs'][key];
}

function getOrFetchConfig(cluster) {
    if (gestaltState.fileExists(CACHED_SERVICES_FILE)) {
        log(`Loading config from '${CACHED_SERVICES_FILE}'`);
        return gestaltState.loadConfigFile(CACHED_SERVICES_FILE);
    }
    console.log(`External service configuration cache '${CACHED_SERVICES_FILE}' not found, fetching...`);
    return fetchConfig();
}

function fetchConfig() {
    // Don't have it, attmept to download
    if (!gestaltState.fileExists(CONFIG_FILE)) {
        throw Error(`${CONFIG_FILE} doesn't exist, cannot load configuration, try running './ext-configure'`);
    }

    const config = gestaltState.loadConfigFile(CONFIG_FILE);

    if (!config['services_config_url']) throw Error(`Configuration is missing 'services_config_url' field`);

    const url = config['services_config_url'];
    const body = gestalt.httpGet(url);
    // Now write to cache file
    const file = CACHED_SERVICES_FILE;
    gestaltState.writeFile(file, JSON.stringify(body, null, 2) + '\n');
    return gestaltState.loadConfigFile(file);
}

function log(str) {
    // console.log(`[Services Config] ${str}`);
}

function runInteractiveConfigure() {

    let config = {};
    if (gestaltState.fileExists(CONFIG_FILE)) {
        try {
            config = gestaltState.loadConfigFile(CONFIG_FILE);
        } catch (err) {
            console.error(`Warning: failed to load ${CONFIG_FILE}`);
        }
    }

    const questions = [
        {
            type: 'input',
            name: 'services_config_url',
            message: "External Service Configuration URL:",
            default: () => {
                return config.services_config_url || '';
            }
        },
    ];

    console.log();
    console.log(`Service Configuration for ${chalk.bold(gestaltState.getConfigUrl())}`);
    console.log();

    inquirer.prompt(questions).then(answers => {
        if (answers.services_config_url.indexOf("://") == -1) {
            answers.services_config_url = 'https://' + answers.services_config_url;
        }

        gestaltState.writeFile(CONFIG_FILE, JSON.stringify(answers, null, 2) + '\n');

        console.log(`Confguration saved.`);
    });
}
