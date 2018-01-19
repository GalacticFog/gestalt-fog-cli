'use strict';
exports.command = 'configure'
exports.desc = 'Configure'
exports.builder = {}
exports.handler = function (argv) {

    require('../lib/gestalt-services-config').runInteractiveConfigure();
}