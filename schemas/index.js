const lambdaSchema = require('./lambda');
const endpointSchema = require('./endpoint');
const serviceSchema = require('./service');
const directorySchema = require('./directory');
const accountStore = require('./accountStore');

module.exports = {
  lambdaSchema,
  endpointSchema,
  serviceSchema,
  directorySchema,
  accountStore
};
