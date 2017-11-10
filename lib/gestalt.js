// Gestalt stuff
const request = require('sync-request');
const os = require('os');
const fs = require('fs');
const CONFIG_DIR = os.homedir() + '/.fog-cli'

// Exports

exports.persistState = persistState;

exports.fetchOrgFqons = () => {
    const res = meta_GET('/orgs?expand=true');
    const list = res.map(item => item.properties.fqon).sort();
    return list;
}

exports.fetchOrgs = () => {
    return meta_GET('/orgs?expand=true');
}

exports.fetchWorkspaces = (fqonList) => {
    if (!fqonList) fqonList = [getGestaltState().org.fqon];

    let workspaces = fqonList.map(fqon => {
        const res = meta_GET(`/${fqon}/workspaces?expand=true`)
        return res;
    });

    workspaces = [].concat.apply([], workspaces); // flatten array

    // console.log(workspaces);
    return workspaces;
}

exports.fetchEnvironments = () => {
    const state = getGestaltState();
    return meta_GET(`/${state.org.fqon}/workspaces/${state.workspace.id}/environments?expand=true`)
}

exports.getEnvironment = (uid) => {
    const state = getGestaltState();
    return meta_GET(`/${state.org.fqon}/environments/${uid}`)
}

exports.getState = () => {
    // returns a copy of the writen state    
    return getGestaltState();
}

exports.fetchContainers = () => {
    // return fetchType('containers');
    return mockContainers();
}

exports.fetchLambdas = () => {
    return fetchType('lambdas');
}

exports.fetchApis = () => {
    return fetchType('apis');
}

exports.fetchPolicies = () => {
    return fetchType('policies');
}

function fetchType(type) {
    const state = getGestaltState();
    return meta_GET(`/${state.org.fqon}/environments/${state.environment.id}/${type}?expand=true`)
}

exports.getContainer = (uid) => {
    const state = getGestaltState();
    const res = meta_GET(`/${state.org.fqon}/containers/${uid}`)
    return res;
    return eval(
        `[{ id: 'a7fd213c-e299-40a8-a5cd-96879ee1d3a5',
        name: 'test-container-with-secret',
        resource_type: 'Gestalt::Resource::Container',
        resource_state: 'Gestalt::Resource::State::Active',
        org: 
         { typeId: '23ba3299-b04e-4c5c-9b3d-64939b22944e',
           id: '99b7d67a-a002-4071-b296-1ee3769bc55d',
           href: 'https://test.galacticfog.com/engineering.eric-test',
           properties: { fqon: 'engineering.eric-test' } },
        owner: 
         { typeId: '58b6775d-37a5-44bc-9115-7331fc4964b7',
           id: '6d730b0d-de3a-47fe-b9bc-47049d992285',
           name: 'gftest',
           href: '/root/users/6d730b0d-de3a-47fe-b9bc-47049d992285' },
        created: 
         { typeId: '58b6775d-37a5-44bc-9115-7331fc4964b7',
           id: '6d730b0d-de3a-47fe-b9bc-47049d992285',
           timestamp: '2017-11-01T16:10:39.509Z' },
        modified: 
         { action: 'update',
           user: '6d730b0d-de3a-47fe-b9bc-47049d992285',
           timestamp: '2017-11-07T15:29:04.490Z' },
        properties: 
         { network: 'default',
           num_instances: 0,
           provider: 
            { name: 'CDK-Test',
              id: 'd3ac9d56-0f18-487f-8fba-1f03ee0efbd0',
              resource_type: 'Gestalt::Configuration::Provider::CaaS::Kubernetes' },
           secrets: [ [Object] ],
           disk: 0,
           tasks_healthy: 0,
           image: 'nginx',
           tasks_running: 0,
           health_checks: [],
           force_pull: false,
           instances: [],
           age: '2017-11-01T16:10:39.000Z',
           volumes: [],
           container_type: 'DOCKER',
           labels: {},
           tasks_staged: 0,
           status: 'SUSPENDED',
           constraints: [],
           tasks_unhealthy: 0,
           external_id: '/namespaces/108f68f6-a4a9-4d8f-85df-0247487ab2b8/deployments/test-container-with-secret',
           cpus: 0.1,
           port_mappings: [],
           env: {},
           memory: 128 } }]`)[0];
}

function mockContainers() {
    return eval(`
    [ { id: 'ea1066f7-d6c6-4f6f-863c-977f0e1bb998',
    name: 'test-container-with-storage',
    resource_type: 'Gestalt::Resource::Container',
    resource_state: 'Gestalt::Resource::State::Active',
    org: 
     { typeId: '23ba3299-b04e-4c5c-9b3d-64939b22944e',
       id: '99b7d67a-a002-4071-b296-1ee3769bc55d',
       href: 'https://test.galacticfog.com/engineering.eric-test',
       properties: [Object] },
    owner: 
     { typeId: '58b6775d-37a5-44bc-9115-7331fc4964b7',
       id: '6d730b0d-de3a-47fe-b9bc-47049d992285',
       name: 'gftest',
       href: '/root/users/6d730b0d-de3a-47fe-b9bc-47049d992285' },
    created: 
     { typeId: '58b6775d-37a5-44bc-9115-7331fc4964b7',
       id: '6d730b0d-de3a-47fe-b9bc-47049d992285',
       timestamp: '2017-10-23T19:26:16.862Z' },
    modified: 
     { action: 'update',
       user: '6d730b0d-de3a-47fe-b9bc-47049d992285',
       timestamp: '2017-10-24T20:43:52.891Z' },
    properties: 
     { network: 'default',
       num_instances: 2,
       provider: [Object],
       secrets: [],
       tasks_healthy: 0,
       image: 'nginx',
       tasks_running: 2,
       health_checks: [],
       force_pull: false,
       instances: [Array],
       age: '2017-10-23T19:26:17.000Z',
       volumes: [Array],
       container_type: 'DOCKER',
       labels: {},
       tasks_staged: 0,
       status: 'RUNNING',
       tasks_unhealthy: 0,
       external_id: '/namespaces/108f68f6-a4a9-4d8f-85df-0247487ab2b8/deployments/test-container-with-storage',
       cpus: 0.1,
       port_mappings: [],
       env: {},
       memory: 128 } },
  { id: 'a7fd213c-e299-40a8-a5cd-96879ee1d3a5',
    name: 'test-container-with-secret',
    resource_type: 'Gestalt::Resource::Container',
    resource_state: 'Gestalt::Resource::State::Active',
    org: 
     { typeId: '23ba3299-b04e-4c5c-9b3d-64939b22944e',
       id: '99b7d67a-a002-4071-b296-1ee3769bc55d',
       href: 'https://test.galacticfog.com/engineering.eric-test',
       properties: [Object] },
    owner: 
     { typeId: '58b6775d-37a5-44bc-9115-7331fc4964b7',
       id: '6d730b0d-de3a-47fe-b9bc-47049d992285',
       name: 'gftest',
       href: '/root/users/6d730b0d-de3a-47fe-b9bc-47049d992285' },
    created: 
     { typeId: '58b6775d-37a5-44bc-9115-7331fc4964b7',
       id: '6d730b0d-de3a-47fe-b9bc-47049d992285',
       timestamp: '2017-11-01T16:10:39.509Z' },
    modified: 
     { action: 'update',
       user: '6d730b0d-de3a-47fe-b9bc-47049d992285',
       timestamp: '2017-11-07T15:29:04.490Z' },
    properties: 
     { network: 'default',
       num_instances: 0,
       provider: [Object],
       secrets: [Array],
       disk: 0,
       tasks_healthy: 0,
       image: 'nginx',
       tasks_running: 0,
       health_checks: [],
       force_pull: false,
       instances: [],
       age: '2017-11-01T16:10:39.000Z',
       volumes: [],
       container_type: 'DOCKER',
       labels: {},
       tasks_staged: 0,
       status: 'SUSPENDED',
       constraints: [],
       tasks_unhealthy: 0,
       external_id: '/namespaces/108f68f6-a4a9-4d8f-85df-0247487ab2b8/deployments/test-container-with-secret',
       cpus: 0.1,
       port_mappings: [],
       env: {},
       memory: 128 } } ]    
    `)
}


// Functions

function meta_GET(url, opts) {
    const token = getCachedAuthToken();
    const options = Object.assign({ headers: { Authorization: `Bearer ${token}` } }, opts); // merge in user specified options
    const meta_url = getGestaltConfig()['gestalt_url'] + '/meta';

    const res = request('GET', `${meta_url}${url}`, options);
    return JSON.parse(res.getBody());
}

function persistState(s) {
    let state = getGestaltState();
    Object.assign(state, s); // merge in state
    const contents = `${JSON.stringify(state, null, 2)}\n`;
    fs.writeFileSync(`${CONFIG_DIR}/state.json`, contents);
}

function getCachedAuthToken() {
    // try cached
    return fs.readFileSync(`${CONFIG_DIR}/auth_token`, 'utf8').trim();
}

function getGestaltConfig() {
    return getJsonFromFile("config.json")
}

function getGestaltState() {
    return getJsonFromFile("state.json")
}

function getJsonFromFile(file) {
    const f = `${CONFIG_DIR}/${file}`;
    if (fs.existsSync(f)) {
        const contents = fs.readFileSync(f, 'utf8');
        return JSON.parse(contents);
    }
    return {};
}