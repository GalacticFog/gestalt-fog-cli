const { object, string, boolean } = require('yup');

module.exports = object().shape({
  name: string().required(),
  description: string().required(),
  accountStoreId: string().required(),
  storeType: string().matches(/^GROUP$/).required(),
  isDefaultAccountStore: boolean().required(),
  isDefaultGroupStore: boolean().required(),
});
