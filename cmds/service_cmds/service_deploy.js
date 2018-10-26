const chalk = require('../lib/chalk');
const gestalt = require('../lib/gestalt');
const cmd = require('../lib/cmd-base');
const { serviceSchema, lambdaSchema, endpointSchema } = require('../../schemas');
const { asyncForEach } = require('../lib/helpers');
const { generateBasePackURL } = require('./util');

module.exports = {
  command: 'deploy',
  desc: 'Deploy a Service',
  builder: {
    file: {
      alias: 'f',
      description: 'service definition file',
      required: true,
    },
    filter: {
      description: 'a',
    },
  },
  handler: cmd.handler(handler),
};

function generatePackUrl(provider, name, func, env) {
  if (!provider.objectStore) {
    return func.package.artifact;
  }

  const BUCKET = 'lambdas';

  return `${generateBasePackURL(env)}/${BUCKET}/${func.package && func.package.artifact || `${name}.zip`}`;
}

async function handler (argv) {
  try {
    console.log(`Loading service spec from file ${argv.file}`);
    const service = serviceSchema.service.cast(cmd.loadObjectFromFile(argv.file));
    const { provider, functions } = service;

    await serviceSchema.service.validate(service)
      .catch(e => {
        throw Error(`Invalid service schema '${e.errors}' in file ${argv.file}`);
      });

    const context = await cmd.resolveContextPath(provider.context);
    const env = await gestalt.getEnvironmentVariables(context);
    const resolvedProvider = await cmd.resolveProvider({
      name: provider.laser,
      org: context.org.fqon,
      provider: provider.laser,
    });

    const apis = await gestalt.fetchEnvironmentApis(context);
    const api = apis.find(a => a.name === provider.api);

    if (!api) {
      throw Error(`Could not find api with name '${provider.api}'`);
    }

    await asyncForEach(Object.values(functions), async (func, i) => {
      const name = Object.keys(functions)[i];
      const f = serviceSchema.serviceFunction.cast(func);
      await serviceSchema.serviceFunction.validate(f)
        .catch(e => {
          throw Error(`Invalid service: functions schema '${e.errors}' in file ${argv.file}`);
        });

      console.log(`Creating ${name} Lambda`);

      const lambda = lambdaSchema.cast({
        name,
        description: f.description,
        properties: {
          code_type: 'package',
          package_url: generatePackUrl(provider, name, f, env),
          handler: f.handler,
          compressed: f.compressed,
          headers: f.headers,
          memory: f.memory,
          cpus: f.cpus,
          timeout: f.timeout,
          public: f.public,
          runtime: f.runtime,
          env: f.variables,
          provider: {
            id: resolvedProvider.id,
            locations: [],
          },
        },
      });

      const response = await gestalt.createLambda(lambda, context);
      console.log(chalk.green(`Successfully created ${name} Lambda`));

      console.log(`Creating ${f.endpoint.path} Endpoint for ${name}`);
      const endpoint = endpointSchema.cast({
        name: f.endpoint.path,
        properties: {
          implementation_id: response.id,
          implementation_type: 'lambda',
          resource: f.endpoint.path,
          hosts: f.endpoint.hosts || [],
          methods: f.endpoint.methods || ['GET'],
          synchronous: f.endpoint.synchronous || true,
          plugins: {
            rateLimit: {
              enabled: f.endpoint['rate-limit'] === -1 ? false : true || false,
              perMinute: f.endpoint['rate-limit'],
            },
            gestaltSecurity: {
              enabled: f.endpoint.secure || false,
            },
          },
        },
      });

      await gestalt.createApiEndpoint(endpoint, {
        org: {
          fqon: context.org.fqon,
        },
        api: {
          id: api.id,
        },
      });

      console.log(chalk.green(`Successfully created ${f.endpoint.path} Endpoint for ${name}`));
    });

    console.log(chalk.green(`Successfully created Service file ${argv.file}`));
  } catch (e) {
    console.error(chalk.red(`There was an error creating the Service ${e}`));
  }
}
