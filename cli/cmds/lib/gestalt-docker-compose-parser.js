const fs = require('fs');
const YAML = require('yamljs');

exports.convertFromV3File = function (composeFile) {
    const contents = readFile(composeFile);
    const compose = YAML.parse(contents);
    const containers = convertV3ComposeToGestalt(compose);
    return containers;
}

exports.convertFromV3 = function (compose) {
    const containers = convertV3ComposeToGestalt(compose);
    return containers;
}

function convertV3ComposeToGestalt(compose) {

    const containers = [];

    Object.entries(compose.services).map(item => {

        // console.log(item);
        const c = convertV3ToContainer(item);
        containers.push(c);
    });
    return containers;
}

function convertV1ComposeToGestalt(compose) {
    const containers = [];
    Object.entries(compose).map(item => {
        const c = convertToContainer(item);
        containers.push(c);
    });
    return containers;
}

function convertV3ToContainer(item) {
    if (item.length != 2) throw Error('item has unexpected length');

    let name = item[0];
    let value = item[1];

    if (!name) throw Error('name not found');
    if (!value.image) throw Error('image not found');
    
    let payload = {
        name: name,
        description: `Converted from Docker Compose v3`,
        properties: {
            num_instances: 1,
            cpus: 0.1,
            memory: 128.0,
            disk: 0.0,
            container_type: "DOCKER",
            image: value.image,
            network: "BRIDGE",
            port_mappings: convertV3Ports(value.ports),
            force_pull: true,
            env: item[1].environment
        }
    };

    return payload;
}

function convertV3Ports(src) {
    let ports = [];
    if (src) {
        src.map(sp => {
            let srcContainerPort = null;
            if (sp.indexOf(':') > -1) {
                // Assume format of 'host:container'
                let str = sp.split(':');  
                srcContainerPort = parseInt(str[1]);
            } else {
                // Assume just container port
                srcContainerPort = parseInt(sp);
            }

            let port = {
                protocol: 'tcp',
                name: `port-${srcContainerPort}`,
                expose_endpoint: false,
                container_port: srcContainerPort
            }
            ports.push(port);
        });
    }
    return ports;
}

function convertV1ToContainer(item) {
    /*
    { mongo: 
       { image: 'mongo:3.0',
         hostname: 'mongo',
         expose: [ '27017' ],
         volumes: [ '/opt/data/mongo_home:/data/db' ],
         restart: 'always',
         mem_limit: '1024m' },
      mongoexpress: 
       { image: 'yeasy/mongo-express',
         hostname: 'mongo-express',
         links: [ 'mongo:mongo' ],
         ports: [ '8081:8081' ],
         restart: 'always',
         mem_limit: '128m',
         environment: [ 'WEB_USER=\'user\'', 'WEB_PASS=\'pass\'' ],
         command: 'sh -c \'sleep 10 && tini -- node app\'' } }
    */

    let payload = {
        name: item[0],
        description: "Converted from Docker Compose V1",
        properties: {
            num_instances: 1,
            cpus: 0.1,
            memory: 128.0,
            disk: 0.0,
            container_type: "DOCKER",
            image: item[1].image,
            network: "BRIDGE",
            port_mappings: [
                // {
                //     protocol: "tcp",
                //     name: "web",
                //     expose_endpoint: true,
                //     container_port: tgt_port
                // }
            ],
            force_pull: true,
            env: convertEnvrionmentVariables(item[1].environment)
        }
    };

    return payload;

    function convertEnvrionmentVariables(src) {
        // [ 'WEB_USER=\'user\'', 'WEB_PASS=\'pass\'' ] --> { WEB_USER: 'user', WEB_PASS: 'pass' }
        const dst = {};
        if (src) {
            src.map(item => {
                let keyval = item.split('=');
                dst[keyval[0]] = keyval[1].substring(1, keyval[1].length - 1);
            })
        }
        return dst;
    }
}

function readFile(file) {
    if (fs.existsSync(file)) {
        const contents = fs.readFileSync(file, 'utf8');
        return contents;
    }
    throw Error(`${file} not found`);
}