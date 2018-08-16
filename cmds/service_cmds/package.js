const chalk = require('chalk');
const AWS = require('aws-sdk');
const gestalt = require('../lib/gestalt');
const cmd = require('../lib/cmd-base');
const { serviceSchema } = require('../../schemas');
const { asyncForEach } = require('../lib/helpers');
const { generateBasePackURL } = require('./util');
const { build } = require('./build');

module.exports = {
  command: 'package',
  desc: 'Package a Service',
  builder: {
    file: {
      alias: 'f',
      description: 'service definition file',
      required: true,
    },
  },
  handler: cmd.handler(handler),
};

async function handler(argv) {
  try {
    console.log(`Preparing to package: Loading service spec from file ${argv.file}`);
    const service = serviceSchema.service.cast(cmd.loadObjectFromFile(argv.file));
    const { provider, functions } = service;

    const context = await cmd.resolveContextPath(provider.context);
    const env = await gestalt.getEnvironmentVariables(context);
    const s3 = new AWS.S3({
      accessKeyId: env.GF_DEFAULT_OBJECT_STORAGE_ACCESS_KEY,
      secretAccessKey: env.GF_DEFAULT_OBJECT_STORAGE_ACCESS_SECRET,
      endpoint: generateBasePackURL(env),
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });

    await asyncForEach(Object.values(functions), async (func, i) => {
      const name = Object.keys(functions)[i];
      const artifactName = `${func.package && func.package.artifact || `${name}.zip`}`;

      const body = await build(func.runtime, artifactName);

      const params = {
        Bucket: 'lambdas',
        Key: artifactName,
        Body: body,
      };

      s3.putObject(params, (err) => {
        if (err)
          console.log(err)
        else
          console.log(chalk.green(`Successfully uploaded ${artifactName}`));
      });
    });

  } catch (e) {
    console.error(chalk.red(`There was an error packaging the Service ${e}`));
  }
}
