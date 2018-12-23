const { object, string, boolean, number, array } = require('yup');

module.exports = object().shape({
  name: string().required(),
  description: string(),
  properties: object().shape({
    code_type: string().matches(/^package$/),
    package_url: string().required(),
    handler: string().required(),
    compressed: boolean().default(false),
    headers: object().default({ Accept: 'text/plain' }),
    memory: number().required().default(128),
    cpus: number().required().default(0.1),
    timeout: number().required().default(60),
    public: boolean().required().default(true),
    runtime: string().required().default('nodejs'),
    env: object().default({}),
    provider: object().shape({
      id: string().required(),
      locations: array().default([])
    }),
  })
});
