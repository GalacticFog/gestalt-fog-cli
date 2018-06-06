const gestalt = require('../lib/gestalt')
const cmd = require('../lib/cmd-base');
const debug = cmd.debug;
exports.command = 'create-sample-resources'
exports.desc = 'Create sample resources'
exports.builder = {
    file: {
        alias: 'f',
        description: 'resource definition file'
    }
}

exports.handler = cmd.handler(async function (argv) {

    // Resolve environment context from command line args
    const context = await cmd.resolveEnvironment(argv);
    const provider = await cmd.resolveProvider(argv, context);
    const laserProvider = await cmd.resolveProvider(argv, context, null, 'laser-provider');

    // Create kafka container
    let spec = cmd.loadObjectFromFile(`${argv.dir}/kafka-container.json`);
    const kafkaHost = `${spec.name}.${context.environment.id}.svc.cluster.local`;
    spec.properties.env['ADVERTISED_HOST'] = kafkaHost;
    await doCreateContainer(context, provider, spec);

    // Create Kafka lambdas
    spec = cmd.loadObjectFromFile(`${argv.dir}/kafka-producer-lambda.json`);
    spec.properties.env['KAFKA_BROKERS'] = kafkaHost + ':9092';
    await doCreateLambda(context, laserProvider, spec);

    spec = cmd.loadObjectFromFile(`${argv.dir}/kafka-consumer-lambda.json`);
    spec.properties.env['KAFKA_BROKERS'] = kafkaHost + ':9092';
    await doCreateLambda(context, laserProvider, spec);

    // // Create in parallel
    // createLambdaFromFile(argv, context, laserProvider, 'dotnet-hello-lambda.json');
    // createLambdaFromFile(argv, context, laserProvider, 'factorial-lambda.json');
    // createLambdaFromFile(argv, context, laserProvider, 'hello-lodash-lambda.json');
    // createLambdaFromFile(argv, context, laserProvider, 'nashorn-hello-lambda.json');
    // createLambdaFromFile(argv, context, laserProvider, 'periodic-lambda.json');
    // createLambdaFromFile(argv, context, laserProvider, 'python2-hello-lambda.json');
    // createLambdaFromFile(argv, context, laserProvider, 'python3-hello-lambda.json');
    // createLambdaFromFile(argv, context, laserProvider, 'sales-lambda.json');
    // createLambdaFromFile(argv, context, laserProvider, 'slack-sales-lambda.json');
    // createLambdaFromFile(argv, context, laserProvider, 'sms-hello-lambda.json');

    // createApiEndpointFromFile(argv, context, laserProvider, 'sms-hello-lambda.json');



});

async function createLambdaFromFile(argv, context, provider, file) {
    let spec = cmd.loadObjectFromFile(`${argv.dir}/${file}`);
    await doCreateLambda(context, provider, spec);
}

async function doCreateContainer(context, provider, spec) {

    spec.properties.provider = provider;

    const container = await gestalt.createContainer(spec, context);
    // console.log(`container: ${JSON.stringify(container, null, 2)}`);
    // console.log(`Container '${container.name}' created from file ${argv.file}.`);
    console.log(`Container '${container.name}' created.`);
    return container;
}

async function doCreateLambda(context, provider, spec) {
    // Build provider spec
    spec.properties.provider = {
        id: provider.id,
        locations: []
    };

    // Create lambda
    const lambda = await gestalt.createLambda(spec, context);
    debug(`lambda: ${JSON.stringify(lambda, null, 2)}`);
    console.log(`Lambda '${lambda.name}' created.`);
    return lambda;
}
