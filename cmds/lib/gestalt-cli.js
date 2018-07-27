const chalk = require('chalk');
const debug = require('./debug').debug;

exports.debug = debug;

exports.out = (any, ...optionalParams) => {
    console.log(any, ...optionalParams);
}

exports.cli = require('./gestalt-cli-base')
exports.ui = require('./gestalt-ui');
exports.gestaltContext = require('./gestalt-context');
