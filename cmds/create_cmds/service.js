const gestalt = require('../lib/gestalt');
const cmd = require('../lib/cmd-base');
const { serviceSchema, lambdaSchema, endpointSchema } = require('../lib/schemas');
const { asyncForEach } = require('../lib/helpers');

const command = 'service';
const desc = 'Create an API Service';
const builder = {
  file: {
    alias: 'f',
    description: 'service definition file',
  },
};

const handler = cmd.handler(async (argv) => {
  if (argv.file) {
    console.log(`Loading service spec from file ${argv.file}`);

    try {
      const service = serviceSchema.cast(cmd.loadYAMLFromFile(argv.file));
      const { provider, functions } = service;
      await serviceSchema.validate(service)
        .catch(e => {
          throw Error(`Invalid service schema '${e.errors}' in file ${argv.file}`);
        });

      const context = await cmd.resolveContextPath(provider.context);
      const resolvedProvider = await cmd.resolveProvider({
        name: provider.laser,
        org: context.org.fqon,
        provider: provider.laser
      });

      const apis = await gestalt.fetchEnvironmentApis(context);
      const api = apis.find(a => a.name === provider.api);

      if (!api) {
        throw Error(`Could not find api with name '${provider.api}'`);
      }

      // when using for each need to wrap with async util
      await asyncForEach(functions, async f => {
        console.log(`Creating ${f.name} Lambda`);

        const lambda = lambdaSchema.cast({
          name: f.name,
          description: f.description,
          properties: {
            code_type: 'package',
            package_url: f['package-url'],
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

        await lambdaSchema.validate(lambda)
          .catch(e => {
            throw Error(`Invalid function:lambda schema '${e.errors}'`);
          });

        const response = await gestalt.createLambda(lambda, context);
        console.log(`Successfully created ${f.name} Lambda`);

        console.log(`Creating ${f.endpoint.path} Endpoint for ${f.name}`);
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

        await endpointSchema.validate(endpoint)
          .catch(e => {
            throw Error(`Invalid function:endpoint schema '${e.errors}'`);
          });

        await gestalt.createApiEndpoint(endpoint, {
          org: {
            fqon: context.org.fqon,
          },
          api: {
            id: api.id,
          },
        });

        console.log(`Successfully created ${f.endpoint.path} Endpoint for ${f.name}`);
      });

      console.log(`Successfully created Service file ${argv.file}`);
    } catch (e) {
      console.error(`There was an error creating the Service ${e}`);
    }
  }

  throw Error('A Service Definition file must be provided');
});

module.exports = {
  command,
  desc,
  builder,
  handler,
};
