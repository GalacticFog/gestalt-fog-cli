const { object, string, boolean, number, array } = require('yup');

module.exports = object().shape({
  name: string().required(),
  description: string(),
  properties: object().shape({
    implementation_id: string().required(),
    implementation_type: string().matches(/^lambda$/),
    resource: string().required(),
    hosts: array().default([]),
    methods: array().required().default(['GET']),
    synchronous: boolean().required().default(true),
    plugins: object().shape({
      rateLimit: object().shape({
        enabled: boolean().required().default(false),
        perMinute: number().required().default(-1),
      }),
      gestaltSecurity: object().shape({
        enabled: boolean().required().default(false),
      })
    }),
  })
});
