const { gestaltContext, contextResolver, actions } = require('..');

global.fog = { debug: true };

test();

async function test() {
    
    try {

        let data = getData();

        data = JSON.parse(data.payload);

        const context = await contextResolver.resolveContextPath('/sandbox/dev-sandbox/dev')
        const { succeeded, failed } = await actions.applyResources(context, data.resources, data.options, data.config);
        console.log(succeeded);
        console.log(failed);
    } catch (err) {
        console.log(err)
    }
}

function getData() {
    return {
        "payload": "{\"context\":{},\"config\":{},\"options\":{\"_\":[\"apply\"],\"d\":\"./nginx-example/bundle\",\"directory\":\"./nginx-example/bundle\",\"render-bundle\":true,\"renderBundle\":true,\"$0\":\"/Users/ericgf/Workspace/gestalt-fog-cli/cli/bin/fog\"},\"resources\":[{\"resource_type\":\"Gestalt::Resource::Container\",\"name\":\"nginx-test\",\"properties\":{\"provider\":{\"properties\":{\"config\":{\"networks\":[]}},\"id\":\"#{Provider /root/default-kubernetes id}\"},\"env\":{},\"labels\":{},\"port_mappings\":[{\"type\":\"external\",\"protocol\":\"tcp\",\"expose_endpoint\":true,\"name\":\"web\",\"lb_port\":80,\"container_port\":80}],\"volumes\":[],\"secrets\":[],\"health_checks\":[],\"force_pull\":false,\"container_type\":\"DOCKER\",\"cpus\":0.5,\"memory\":128,\"num_instances\":1,\"image\":\"nginx\",\"network\":\"default\",\"accepted_resource_roles\":[],\"constraints\":[]}}]}"
    }
}