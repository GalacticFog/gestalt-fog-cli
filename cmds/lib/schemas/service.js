const { object, string, boolean, number, array } = require('yup');

module.exports = object().shape({
  service: string().required(),
  description: string(),
  provider: object().shape({
    name: string().required(),
    context: string().required(),
    laser: string().required(),
    api: string().required(),
  }).required(),
  functions: array().of(object().shape({
    name: string().required(),
    description: string(),
    'package-url': string().required(),
    handler: string().required(),
    compressed: boolean().default(false),
    headers: object().default({ Accept: 'text/plain' }),
    memory: number().default(128),
    cpus: number().default(0.1),
    timeout: number().default(60),
    public: boolean().default(true),
    runtime: string().default('nodejs'),
    variables: object().default({}),
    endpoint: object().shape({
      path: string().required(),
      hosts: array().default([]),
      methods: array().default(['GET']),
      synchronous: boolean().default(true),
      secure: boolean().default(false),
      'rate-limit': number().default(60),
    }),
  }).required()),
  plugins: string().required(),
});
