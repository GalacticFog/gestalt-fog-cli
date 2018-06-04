// const dockerComposeParser = require('../lib/gestalt-docker-compose-parser');
// const selectProvider = require('../lib/selectProvider');
// const displayResource = require('../lib/displayResourceUI');
// const selectEnvironment = require('../lib/selectEnvironment');
// const gestalt = require('../lib/gestalt');
// const selectHierarchy = require('../lib/selectHierarchy');
// const chalk = require('chalk');
// const cmd = require('../lib/cmd-base');
// exports.command = 'deploy-from-docker-compose [file]'
// exports.desc = 'Deploy from Docker Compose file'
// exports.builder = {}
// exports.handler = cmd.handler(async function (argv) {

// });


// const CaaSTypes = {
//     DCOS: "dcos",
//     KUBE: "kube",
//     SWARM: "swarm"
// };

// const defaultWorkspace =
//     {
//         "name": "gestalt-system-workspace",
//         "description": "Gestalt System Workspace"
//     }

// const defaultEnvironment =
//     {
//         "name": "gestalt-system-environment",
//         "description": "Gestalt System Environment",
//         "properties": {
//             "environment_type": "development"
//         }
//     }

// const laserEnvironment =
//     {
//         "name": "gestalt-laser-environment",
//         "description": "Gestalt Laser Environment",
//         "properties": {
//             "environment_type": "development"
//         }
//     }



// function dbProvider(secrets) {
//     return {
//         "name": "default-postgres",
//         "description": "The gestalt database",
//         "resource_type": "Gestalt::Configuration::Provider::Data::PostgreSQL",
//         "properties": {
//             "config": {
//                 "env": {
//                     "public": {
//                         "USER": secrets.username,
//                         "PASSWORD": secrets.password,
//                         "HOSTNAME": secrets.host,
//                         "PORT": secrets.port,
//                         "PROTOCOL": secrets.protocol
//                     }
//                 },
//                 "private": {
//                 }
//             }
//         },
//         "services": []
//     }
// }
// }

// function securityProvider(secrets) {
//     // 	val realm = secrets.realm.map(r => s"""
//     // 		, "REALM": "$r"
//     // """).getOrElse("")

//     return {
//         "name": "default-security",
//         "description": "The Default Security Provider",
//         "resource_type": "Gestalt::Configuration::Provider::Security",
//         "properties": {
//             "config": {
//                 "env": {
//                     "public": {
//                         "KEY": `${secrets.key}`,
//                         "SECRET": `${secrets.secret}`,
//                         "HOSTNAME": `${secrets.host}`,
//                         "PORT": `${secrets.port}`,
//                         "PROTOCOL": `${secrets.protocol}`
//                         //   $realm
//                     },
//                     "private": {
//                     }
//                 }
//             },
//             "services": []
//         }
//     };
// }

// function caasProvider(secrets, caasType) {
//     // val networksListJson = secrets.networks.map(_.split(",").map(n => { "name": n	))).map(JsArray(_))
//     // .getOrElse[JsArray](Json.arr(
//     //     {"name": "HOST"},
//     //     {"name": "BRIDGE"}
//     // }

//     let networksListJson = [
//         { "name": "HOST" },
//         { "name": "BRIDGE" }
//     ]

//     switch (caasType) {
//         case CaaSTypes.SWARM:
//             return {
//                 "name": "default-swarm",
//                 "description": "The Default Swarm Provider",
//                 "resource_type": "Gestalt::Configuration::Provider::CaaS::Docker",
//                 "properties": {
//                     "config": {
//                         "url": secrets.url || "unix:///var/run/docker.sock",
//                         "networks": networksListJson
//                     },
//                     "locations": [],
//                     "environments": ["development"]
//                 }
//             }
//         case CaaSTypes.DCOS:
//             if (!secrets.url) throw Error("DCOS provider requires URL");
//             if (!secrets.auth) secrets.auth = {
//                 "scheme": "Basic",
//                 "username": secrets.username ? secrets.username : "",
//                 "password": secrets.password ? secrets.password : ""
//             }
//             return {
//                 "name": "default-dcos",
//                 "description": "The Default DC/OS Provider",
//                 "resource_type": "Gestalt::Configuration::Provider::CaaS::DCOS",
//                 "properties": {
//                     "schema": "http://meta.gf.com/schemas/compute::marathon.json",
//                     "config": {
//                         "url": url,
//                         "auth": auth,
//                         "networks": networksListJson,
//                         "appGroupPrefix": secrets.appGroupPrefix,
//                         "accept_any_cert": secrets.acceptAnyCert || 'false',
//                         "dcos_cluster_name": secrets.dcosClusterName,
//                         "marathon_framework_name": secrets.marathonFrameworkName,
//                         "haproxyGroup": secrets.loadBalancerGroups.join(',') || "external",
//                         "secret_url": secrets.dcosSecretUrl,
//                         "secret_support": secrets.dcosSecretSupport,
//                         "secret_store": secrets.dcosSecretStore
//                     },
//                     "locations": { "name": "us-west-1", "enabled": "true" },
//                     "environments": ["development"]
//                 }
//             }
//         case CaaSTypes.KUBE:
//             return {
//                 "name": "default-kubernetes",
//                 "description": "The Default Kubernetes Provider",
//                 "resource_type": "Gestalt::Configuration::Provider::CaaS::Kubernetes",
//                 "properties": {
//                     "config": {
//                         "env": {
//                             "public": {},
//                             "private": {}
//                         },
//                         "networks": networksListJson
//                     },
//                     "services": [],
//                     "locations": [],
//                     "data": secrets.kubeconfig
//                 }
//             }
//         default: throw Error(`Invalid CaaS type: '${invalid}'. Must be '${CaaSTypes.DCOS}' or '${CaaSTypes.KUBE}' or '${CaaSTypes.SWARM}'.`);
//     }
// }

// //NOTE : data only because this is being externally orchestrated
// function rabbitProvider(secrets) {
//     return {
//         "name": "default-rabbit",
//         "description": "The data only rabbit provider",
//         "resource_type": "Gestalt::Configuration::Provider::Messaging::RabbitMQ",
//         "properties": {
//             "config": {
//                 "env": {
//                     "public": {
//                         "SERVICE_HOST": secrets.host,
//                         "SERVICE_PORT": secrets.port
//                     },
//                     "private": {}
//                 }
//             },
//             "linked_providers": [],
//             "services": []
//         }
//     }
// }

// function loggingProvider(secrets, caasType, computeId, providerName, extraEnv) {
//     let network = secrets.serviceConfig.network || (caasType == CaaSTypes.DCOS) ? "BRIDGE" : ""

//     let svcPortMapping = {
//         "name": "service",
//         "protocol": "tcp",
//         "expose_endpoint": true,
//         "container_port": 9000,
//         "lb_port": 9000,
//         "service_port": 0,
//         "virtual_hosts": secrets.serviceConfig.vhost.split(',') //secrets.serviceConfig.vhost.map(Seq(_)).getOrElse[Seq[String]](Seq.empty)
//     }

//     let privateEnv = {
//         "ES_CLUSTER_NAME": secrets.esConfig.esClusterName,
//         "ES_COMPUTE_TYPE": secrets.esConfig.esComputeType,
//         "ES_COLD_DAYS": secrets.esConfig.esColdDays.toString,
//         "ES_HOT_DAYS": secrets.esConfig.esHotDays.toString,
//         "ES_SERVICE_HOST": secrets.esConfig.esServiceHost,
//         "ES_SERVICE_PORT": secrets.esConfig.esServicePort.toString,
//         "ES_SNAPSHOT_REPO": secrets.esConfig.esSnapshotRepo,
//         "DCOS_HOST": secrets.dcosConfig.dcosHost,
//         "DCOS_PORT": secrets.dcosConfig.dcosPort.toString,
//         "DCOS_PROTOCOL": secrets.dcosConfig.dcosProtocol,
//         "DCOS_SVC_ACCOUNT_CREDS": secrets.dcosConfig.dcosSvcAccountCreds,
//         "DCOS_AUTH": secrets.dcosConfig.dcosAuth
//     }

//     privateEnv = Object.assign(privateEnv, extraEnv);


//     return {
//         "name": providerName || "default-logging",
//         "description": "The default logging provider",
//         "resource_type": "Gestalt::Configuration::Provider::Logging",
//         "properties": {
//             "config": {
//                 "env": {
//                     "public": {
//                         "SERVICE_VHOST_0_PROTOCOL": secrets.serviceConfig.vhostProto
//                     },
//                     "private": privateEnv
//                 }
//             },
//             "linked_providers": [],
//             "services": [
//                 {
//                     "init": {
//                         "binding": "eager",
//                         "singleton": true
//                     },
//                     "container_spec": {
//                         "name": "log",
//                         "properties": {
//                             "cpus": secrets.serviceConfig.cpus || 0.50,
//                             "memory": secrets.serviceConfig.memory || 1024,
//                             "env": {
//                                 "JAVA_OPTS": "-Xmx768m"
//                             },
//                             "num_instances": 1,
//                             "network": network,
//                             "container_type": "DOCKER",
//                             "image": secrets.serviceConfig.image,
//                             "force_pull": true,
//                             "health_checks": [],
//                             "provider": {
//                                 "id": computeId
//                             },
//                             "labels": {},
//                             "port_mappings": svcPortMapping
//                         }
//                     }
//                 }
//             ]
//         }
//     };
// }

// function zipWithIndex(array) {
//     var result = []
//     for (var i = 0, _aLength = array.length; i < _aLength; i++) {
//         var element = array[i]
//         result.push([element, i])
//     }
//     return result
// }


// function laserProvider(secrets,
//     executorIds,
//     laserFQON,
//     securityId,
//     computeId,
//     rabbitId,
//     dbId,
//     caasType,
//     providerName,
//     extraEnv) {

//     let executorLinksPayloads = zipWithIndex(executorIds).map((pid, idx) => {
//         return {
//             "name": `EXECUTOR_${idx}`,
//             "id": pid,
//             "location": "dcos"
//         };
//     });


//     // let urlParse = "^(http|https)://(.*):([0-9]+)$".r
//     const url = require('url');
//     const parsed = url.parse(secrets.caasConfig.computeUrl);
//     const protocol = parsed.protocol;
//     const port = parsed.port;
//     const host = parsed.hostname;

//     let healthChecks = {};
//     if (secrets.caasConfig.healthCheckProtocol == "HTTP") {
//         healthChecks = {
//             "grace_period_seconds": 300,
//             "interval_seconds": 60,
//             "max_consecutive_failures": 3,
//             "path": "/health",
//             "port_index": 0,
//             "port_type": "index",
//             "protocol": proto,
//             "timeout_seconds": 20
//         };
//     }

//     let network = secrets.caasConfig.network;
//     if (!network) {
//         if (caasType == CaaSTypes.DCOS)
//             network = "HOST";
//         else
//             network = "BRIDGE";
//     }

//     let isHostNetworking = (network == "HOST")

//     let command = null;
//     if (caasType == CaaSTypes.DCOS) {
//         if (isHostNetworking) {
//             command = "ADVERTISE_HOSTNAME=$HOST MANAGEMENT_PORT=$PORT1 ./bin/gestalt-laser -Dhttp.port=$PORT0"
//         } else {
//             command = "./bin/gestalt-laser -Dhttp.port=9000";
//         }
//     } else if (caasType == CaaSTypes.SWARM) {
//         command = "ADVERTISE_HOSTNAME=$HOSTNAME ./bin/gestalt-laser";
//     } else {
//         command = "./bin/gestalt-laser";
//     }

//     let baseSvcPortMapping = {
//         "name": "service",
//         "protocol": "tcp",
//         "expose_endpoint": true,
//         "virtual_hosts": secrets.serviceConfig.laserVHost //.map(Seq(_)).getOrElse[Seq[String]](Seq.empty)
//     }

//     // this is complicated... apologies... but host networking (which is going away) requires service_port in the dcos caas adapter for the VIP
//     // however, otherwise, we just need container_port, and service_port is what we'll use to indicate the requested service port on docker
//     let portMappings = null;
//     if (isHostNetworking) {
//         portMappings = [Object.assign(baseSvcPortMapping,
//             {
//                 "host_port": 0,
//                 "service_port": 0,
//                 "lb_port": 9000
//             }),
//             {
//                 "name": "mgmt",
//                 "protocol": "tcp",
//                 "host_port": 0,
//                 "expose_endpoint": false
//             }];
//     } else {
//         if (caasType == CaaSTypes.SWARM) {
//             portMappings = [Object.assign(baseSvcPortMapping,
//                 {
//                     "container_port": 9000,
//                     "service_port": servicePortOverride,
//                     "lb_port": 9000
//                 })]
//         } else {
//             portMappings = [Object.assign(baseSvcPortMapping,
//                 {
//                     "container_port": 9000,
//                     "lb_port": 9000
//                 })];
//         }
//     }

//     let publicEnv = {
//         "SERVICE_PORT_OVERRIDE": secrets.serviceConfig.servicePortOverride,
//         "SERVICE_PORT_OVERRIDE": secrets.serviceConfig.serviceHostOverride
//     }

//     let privateEnv = {
//         "LAMBDA_DATABASE_NAME": secrets.serviceConfig.dbName,
//         "RABBIT_MONITOR_TOPIC": secrets.queueConfig.monitorTopic,
//         "RABBIT_RESPONSE_TOPIC": secrets.queueConfig.responseTopic,
//         "RABBIT_LISTEN_ROUTE": secrets.queueConfig.listenRoute,
//         "RABBIT_MONITOR_EXCHANGE": secrets.queueConfig.monitorExchange,
//         "RABBIT_RESPONSE_EXCHANGE": secrets.queueConfig.responseExchange,
//         "RABBIT_EXCHANGE": secrets.queueConfig.listenExchange,
//         "META_PROTOCOL": protocol,
//         "META_PORT": port,
//         "META_HOSTNAME": host,
//         "META_PASSWORD": secrets.caasConfig.computeUsername,
//         "META_USER": secrets.caasConfig.computePassword,
//         "META_COMPUTE_PASSWORD": secrets.caasConfig.computePassword,
//         "META_COMPUTE_USERNAME": secrets.caasConfig.computeUsername,
//         "META_COMPUTE_HOST": secrets.caasConfig.computeUrl,
//         "META_COMPUTE_FQON": laserFQON,
//         "META_COMPUTE_PROVIDER_ID": computeId,
//         "META_NETWORK_NAME": network,
//         "GESTALT_SCHEDULER": "true",
//         "MANAGEMENT_PROTOCOL": "ws"
//     }

//     privateEnv = Object.assign(privateEnv, {
//         "ADVERTISE_HOSTNAME": secrets.schedulerConfig.laserAdvertiseHostname,
//         "ES_HOST": secrets.schedulerConfig.esHost,
//         "ES_PORT": secrets.schedulerConfig.esPort,
//         "ES_PROTOCOL": secrets.schedulerConfig.esProtocol,
//         "ETHERNET_PORT": secrets.serviceConfig.laserEthernetPort,
//         "MANAGEMENT_PORT": secrets.schedulerConfig.laserExecutorPort,
//         "MAX_COOL_CONNECTION_TIME": secrets.schedulerConfig.laserMaxCoolConnectionTime,
//         "EXECUTOR_HEARTBEAT_TIMEOUT": secrets.schedulerConfig.laserExecutorHeartbeatTimeout,
//         "EXECUTOR_HEARTBEAT_MILLIS": secrets.schedulerConfig.laserExecutorHeartbeatPeriod,
//         "MIN_COOL_EXECUTORS": secrets.schedulerConfig.globalMinCoolExecutors,
//         "SCALE_DOWN_TIME_SECONDS": secrets.schedulerConfig.globalScaleDownTimeSecs
//     }, extraEnv);

//     return {
//         "name": providerName.getOrElse[String]("default-laser"),
//         "description": "The default laser provider",
//         "resource_type": "Gestalt::Configuration::Provider::Lambda",
//         "properties": {
//             "config": {
//                 "env": {
//                     "public": publicEnv,
//                     "private": privateEnv
//                 }
//             },
//             "linked_providers": [
//                 {
//                     "name": "LAMBDA_DATABASE",
//                     "id": dbId,
//                     "location": "dcos"
//                 },
//                 {
//                     "name": "GESTALT_SECURITY",
//                     "id": securityId,
//                     "location": "dcos"
//                 },
//                 {
//                     "name": "RABBIT",
//                     "id": rabbitId,
//                     "location": "dcos"
//                 }
//             ].concat(executorLinksPayloads),
//             "services": [{
//                 "init": {
//                     "binding": "eager",
//                     "singleton": true
//                 },
//                 "container_spec": {
//                     "name": "lsr",
//                     "properties": {
//                         "cpus": secrets.serviceConfig.laserCpu,
//                         "memory": secrets.serviceConfig.laserMem,
//                         "accepted_resource_roles": [
//                             "production",
//                             "*"
//                         ],
//                         "env": {},
//                         "num_instances": 1,
//                         "network": network,
//                         "container_type": "DOCKER",
//                         "image": secrets.serviceConfig.laserImage,
//                         "force_pull": true,
//                         "health_checks": healthChecks,
//                         "provider": {
//                             "id": computeId
//                         },
//                         "labels": {},
//                         "port_mappings": portMappings,
//                         "cmd": command
//                     }
//                 }
//             }]
//         }
//     };
// }

// function executorPayload(secrets) {
//     let publicEnv = Oject.assign({
//         "IMAGE": secrets.image,
//         "NAME": secrets.name,
//         "CMD": secrets.cmd,
//         "RUNTIME": secrets.runtime
//     }, secrets.extraEnv);

//     return {
//         "name": `${secrets.name}-executor`,
//         "description": `The ${secrets.name} runtime executor`,
//         "resource_type": `Gestalt::Configuration::Provider::Lambda::Executor::${secrets.metaType}`,
//         "properties": {
//             "config": {
//                 "env": {
//                     "public": publicEnv,
//                     "private": {}
//                 }
//             },
//             "services": []
//         }
//     };
// }

// function policyProvider(secrets, computeId, laserId, rabbitId, caasType, providerName, extraEnv) {

//     let network = secrets.serviceConfig.network || "BRIDGE"

//     let healthChecks = {};

//     if ((secrets.serviceConfig.healthCheckProtocol || "HTTP") == proto) {
//         healthChecks = {
//             "grace_period_seconds": 300,
//             "interval_seconds": 60,
//             "max_consecutive_failures": 3,
//             "path": "/health",
//             "port_index": 0,
//             "port_type": "index",
//             "protocol": proto,
//             "timeout_seconds": 20
//         };
//     }

//     let privateEnv = Object.assign({
//         "RABBIT_EXCHANGE": secrets.rabbitConfig.rabbitExchange,
//         "RABBIT_ROUTE": secrets.rabbitConfig.rabbitRoute,
//         "LASER_USER": secrets.laserConfig.laserUser,
//         "LASER_PASSWORD": secrets.laserConfig.laserPassword
//     }, extraEnv);

//     return {
//         "name": providerName || "policy",
//         "description": "The Default Policy Provider",
//         "resource_type": "Gestalt::Configuration::Provider::Policy",
//         "properties": {
//             "config": {
//                 "env": {
//                     "public": {},
//                     "private": privateEnv
//                 }
//             },
//             "linked_providers": [
//                 {
//                     "name": "LASER",
//                     "id": laserId,
//                     "location": "dcos"
//                 },
//                 {
//                     "name": "RABBIT",
//                     "id": rabbitId,
//                     "location": "dcos"
//                 }
//             ],
//             "services": [{
//                 "init": {
//                     "binding": "eager",
//                     "singleton": true
//                 },
//                 "container_spec": {
//                     "name": "pol",
//                     "properties": {
//                         "cpus": secrets.serviceConfig.cpus || 0.2,
//                         "memory": secrets.serviceConfig.memory || 768,
//                         "accepted_resource_roles": ["production", "*"],
//                         "env": {},
//                         "num_instances": 1,
//                         "network": network,
//                         "container_type": "DOCKER",
//                         "image": secrets.serviceConfig.image,
//                         "force_pull": true,
//                         "health_checks": healthChecks,
//                         "provider": { "id": computeId },
//                         "labels": {},
//                         "port_mappings": [{
//                             "name": "service",
//                             "protocol": "tcp",
//                             "container_port": 9000,
//                             "lb_port": 9000,
//                             "expose_endpoint": true
//                         }]
//                     }
//                 }
//             }]
//         }
//     };
// }

// function kongProvider(secrets, dbId, computeId, caasType, providerName, extraEnv) {

//     let gatewayVhosts = secrets.kongConfig.gatewayVHost //.flatten
//     let serviceVhost = secrets.kongConfig.serviceVHost //.flatten

//     let externalProtocol = secrets.kongConfig.externalProtocol || (caasType == CaaSTypes.DCOS) ? "https" : "http"  // for backwards compatibility if not specified

//     let healthChecks = {};
//     if ((secrets.serviceConfig.healthCheckProtocol || "HTTP") == proto) {
//         healthChecks = {
//             "grace_period_seconds": 300,
//             "interval_seconds": 60,
//             "max_consecutive_failures": 3,
//             "path": "/",
//             "port_index": 1,
//             "port_type": "index",
//             "protocol": proto,
//             "timeout_seconds": 20
//         };
//     }

//     //this is the workaround for certain kong container conditions where the serf doens't bind properly in kube
//     let kubeEnvVars = (caasType == CaaSTypes.KUBE) ? {
//         "KONG_CLUSTER_ADVERTISE": "$(POD_IP):7946",
//         "KONG_CLUSTER_LISTEN": "$(POD_IP):7946"
//     } : {};

//     let privateEnv = Object.assign({
//         "KONG_LUA_PACKAGE_PATH": "/usr/local/custom/?.lua;;",
//         "KONG_CUSTOM_PLUGINS": "gestalt-security-kong",
//         "POSTGRES_NAME": secrets.kongConfig.dbName
//     },
//         kubeEnvVars,
//         extraEnv);

//     let network = secrets.serviceConfig.network || "BRIDGE";

//     return {
//         "name": providerName || "default-kong",
//         "description": "The default gestalt kong provider",
//         "resource_type": "Gestalt::Configuration::Provider::Kong",
//         "properties": {
//             "config": {
//                 "env": {
//                     "public": {
//                         "USERNAME": "unuse",
//                         "PASSWORD": "currently"
//                     },
//                     "private": privateEnv
//                 },
//                 "external_protocol": externalProtocol
//             },
//             "linked_providers": [
//                 { "name": "POSTGRES", "id": dbId }
//             ],
//             "services": [{
//                 "init": {
//                     "binding": "eager",
//                     "singleton": true
//                 },
//                 "container_spec": {
//                     "name": "kng",
//                     "properties": {
//                         "cpus": secrets.serviceConfig.cpus || 0.2,
//                         "memory": secrets.serviceConfig.memory || 1024,
//                         "accepted_resource_roles": ["production", "*"],
//                         "env": {},
//                         "num_instances": 1,
//                         "network": network,
//                         "container_type": "DOCKER",
//                         "image": secrets.serviceConfig.image,
//                         "force_pull": true,
//                         "health_checks": healthChecks,
//                         "provider": { "id": computeId },
//                         "labels": {},
//                         "port_mappings": [
//                             {
//                                 "name": "public-url",
//                                 "protocol": "tcp",
//                                 "container_port": 8000,
//                                 "lb_port": 8000,
//                                 "service_port": secrets.kongConfig.servicePort.getOrElse[Int](0),
//                                 "expose_endpoint": true,
//                                 "virtual_hosts": gatewayVhosts
//                             },
//                             {
//                                 "name": "service",
//                                 "protocol": "tcp",
//                                 "container_port": 8001,
//                                 "lb_port": 8001,
//                                 "expose_endpoint": true,
//                                 "virtual_hosts": serviceVhost
//                             }
//                         ]
//                     }
//                 }
//             }]
//         }
//     };
// }

// function gatewayProvider(secrets, kongId, dbId, computeId, securityId, providerName, extraEnv) {

//     let gatewayVhosts = secrets.gwmConfig.gatewayVHost; //.flatten

//     let network = secrets.serviceConfig.network || "BRIDGE";

//     let healthChecks = {};
//     if ((secrets.serviceConfig.healthCheckProtocol || "HTTP") == proto) {
//         healthChecks = {
//             "grace_period_seconds": 300,
//             "interval_seconds": 60,
//             "max_consecutive_failures": 3,
//             "path": "/health",
//             "port_index": 0,
//             "port_type": "index",
//             "protocol": proto,
//             "timeout_seconds": 20
//         };
//     }

//     let pubEnvVars = {
//         "SERVICE_PORT_OVERRIDE": secrets.gwmConfig.servicePortOverride,
//         "SERVICE_HOST_OVERRIDE": secrets.gwmConfig.serviceHostOverride
//     }

//     let prvEnvVars = Object.assign({
//         "GATEWAY_DATABASE_NAME": secrets.gwmConfig.dbName
//     }, extraEnv);

//     let portMapping = {
//         "name": "service",
//         "protocol": "tcp",
//         "container_port": 9000,
//         "lb_port": 9000,
//         "expose_endpoint": true,
//         "virtual_hosts": gatewayVhosts
//     }
//     if (secrets.gwmConfig.servicePortOverride) {
//         portMapping["service_port"] = secrets.gwmConfig.servicePortOverride;
//     }

//     return {
//         "name": providerName || "default-gwm",
//         "description": "The default Gestalt Gateway Provider",
//         "resource_type": "Gestalt::Configuration::Provider::GatewayManager",
//         "properties": {
//             "config": {
//                 "env": {
//                     "public": pubEnvVars,
//                     "private": prvEnvVars
//                 }
//             },
//             "linked_providers": [
//                 {
//                     "name": "KONG_0",
//                     "id": kongId,
//                     "location": "dcos"
//                 },
//                 {
//                     "name": "GATEWAY_DATABASE",
//                     "id": dbId,
//                     "location": "dcos"
//                 },
//                 {
//                     "name": "GESTALT_SECURITY",
//                     "id": securityId,
//                     "location": "dcos"
//                 }
//             ],
//             "services": [
//                 {
//                     "init": {
//                         "binding": "eager",
//                         "singleton": true
//                     },
//                     "container_spec": {
//                         "name": "gwm",
//                         "properties": {
//                             "cpus": secrets.serviceConfig.cpus || 0.25,
//                             "memory": secrets.serviceConfig.memory || 768,
//                             "accepted_resource_roles": ["production", "*"],
//                             "env": {},
//                             "num_instances": 1,
//                             "network": network,
//                             "container_type": "DOCKER",
//                             "image": secrets.serviceConfig.image,
//                             "force_pull": true,
//                             "health_checks": healthChecks,
//                             "provider": { "id": computeId },
//                             "labels": {},
//                             "port_mappings": [portMapping]
//                         }

//                     }
//                 }
//             ]
//         }
//     };
// }

// async function setupDefaultProviders(props, caasType, secretsFile) {
//     console.error("creating default providers...");

//     let secrets = parseSecrets(secretsFile)

//     if (!props.metaUrl) throw Error("missing meta url");
//     if (!props.usertoken) throw new RuntimeException("missing bearer token");

//     let meta = props.metaUrl;
//     let bearer = props.usertoken;
//     let baseUrl = meta + "/root"

//     console.error("creating default workspace...")
//     // let workspaceId = (await HttpClient.sendPost(`${baseUrl}/workspaces`, defaultWorkspace, bearer, 180)).id;
//     let workspaceId = (await gestalt.createWorkspace(defaultWorkspace, 'root')).id;

//     const context = {
//         org: {
//             fqon: 'root'
//         },
//         workspace: {
//             id: workspaceId
//         }
//     }

//     console.error(`creating default environment in workspace (${workspaceId})...`);
//     let environmentId = (await gestalt.createEnvironment(defaultEnvironment, context)).id;

//     console.error(`creating environment for laser containers...`);
//     let laserEnvId = (await gestalt.createEnvironment(laserEnvironment, context)).id;
//     let laserFQON = `/root/environments/${laserEnvId}/containers`;

//     let providerUrl = `${baseUrl}/providers`;

//     console.error("creating the db provider...")
//     let dbPayload = dbProvider(secrets.database)
//     let dbProviderId = (await gestalt.createOrgProvider(dbPayload, context)).id;

//     console.error("creating the security provider...")
//     let secPayload = securityProvider(secrets.security)
//     let securityId = (await gestalt.createOrgProvider(secPayload, context)).id;

//     let caasId = null;
//     if (secrets.caasId) {
//         caasId = secrets.caasId;
//         console.error(`using the caas provider ${caasId}`);
//     } else {
//         console.error("creating the caas provider...");
//         let caasPayload = caasProvider(secrets.caas, caasType)
//         caasId = (await gestalt.createOrgProvider(caasPayload, context)).id;
//     }

//     console.error("creating the rabbit provider...")
//     let rabbitPayload = rabbitProvider(secrets.rabbit)
//     let rabbitId = (await gestalt.createOrgProvider(rabbitPayload, context)).id;

//     console.error("creating the laser executor provider(s)...")
//     let executorIds = [];
//     for (let exec of secrets.laser.executors) {
//         let execPayload = executorPayload(exec)
//         let id = (await gestalt.createOrgProvider(execPayload, context)).id;
//         executorIds.push(id);
//     }

//     console.error("creating the laser provider...")
//     let laserPayload = laserProvider(secrets.laser, executorIds, laserFQON, securityId, caasId, rabbitId, dbProviderId, caasType)
//     let laserId = (await gestalt.createOrgProvider(laserPayload, context)).id;

//     console.error("creating the policy provider...")
//     let policyPayload = policyProvider(secrets.policy, caasId, laserId, rabbitId, caasType)
//     let policyId = (await gestalt.createOrgProvider(policyPayload, context)).id;

//     console.error("creating the kong provider...")
//     let kongPayload = kongProvider(secrets.kong, dbProviderId, caasId, caasType)
//     let kongId = (await gestalt.createOrgProvider(kongPayload, context)).id;

//     console.error("creating the gateway manager service...")
//     let gwmPayload = gatewayProvider(secrets.gateway, kongId, dbProviderId, caasId, securityId)
//     let gwmId = (await gestalt.createOrgProvider(gwmPayload, context)).id;
// }

// function getExecutors(providerMap, providerType) {
//     let filtered = {};
//     for (let key of Object.keys(providerMap)) {
//         if (key.startsWith(providerType)) {
//             filtered[key] = providerMap[key];
//         }
//     }
//     return filtered;
// }

// function getOrCreateProvider(providerMap, bearer, providerType, providerUrl, payload) {

//     //this allows you to search for a provider of a base type and just use the first derived type (useful for cass providers)

//     // val firstType = providerMap.keys.toSeq.filter{ key => key.startsWith( providerType ) }.headOption
//     let firstType = null;
//     for (let key of Object.keys(providerMap)) {
//         if (key.startsWith(providerType)) {
//             firstType = providerMap[key];
//             break;
//         }
//     }

//     if (firstType) {
//         return firstType;
//     }

//     return (await HttpClient.sendPost(providerUrl, payload, bearer, 180)).id;


//     // firstType.map{ baseType =>
//     // 	providerMap.get( baseType ).get
//     // }.getOrElse {
//     // 	HttpClient.sendPost( providerUrl, payload, bearer, 180 ).map{ json => getId(json) }.get
//     // }
// }

// function setupLambdaProviders(meta, bearer, fqon, envuuid, secretsFile, caasType) {
//     console.error("creating lambda providers...")

//     let secrets = parseSecrets(secretsFile)

//     console.error("lookup default workspace...")
//     let wsId = (await HttpClient.sendGet(`${meta}/${fqon}/environments/$envuuid`, bearer, {}, 180)).properties.workspace.id; //.map { json => (json \ "properties" \ "workspace" \ "id").get.toString.replaceAll("\"","") }.get

//     console.error(`wsID = ${wsId}`)

//     let providerMap = lookupProviders(meta, bearer, "root", envuuid)
//     console.error(`providermap = ${providerMap}`)

//     console.error(`creating environment for laser containers...`)
//     // let laserEnvId = HttpClient.sendGet( s"${meta}/${fqon}/environments", bearer, Map(), 180 ).flatMap{ json =>
//     // 	val array = json.asInstanceOf[JsArray]
//     //     array.value.filter{ entry => ( entry \ "name").get.toString.replaceAll("\"","") == "gestalt-laser-environment" }.map{ j => getId(j) }.headOption
//     // } getOrElse {
//     // 	HttpClient.sendPost( s"${meta}/${fqon}/workspaces/$wsId/environments", Some(laserEnvironment), bearer, 180 ).map{ json => getId(json) }.get
//     // }

//     let laserEnvId = null;
//     let envs = (await HttpClient.sendGet(`${meta}/${fqon}/environments`, bearer, {}, 180));
//     for (let env of envs) {
//         if (env.name == 'gestalt-laser-environment') {
//             laserEnvId = env.id;
//             break;
//         }
//     }
//     if (!laserEnvId) {
//         laserEnvId = (await HttpClient.sendPost(`${meta}/${fqon}/workspaces/${wsId}/environments`, laserEnvironment, bearer, 180)).id;
//     }

//     let laserFQON = `/root/environments/${laserEnvId}/containers`

//     let providerUrl = `${meta}/${fqon}/environments/${envuuid}/providers`

//     console.error("lookup or create the core providers ...")

//     console.error("getting the db provider")
//     let dbType = "Gestalt::Configuration::Provider::Data::PostgreSQL"
//     let dbPayload = dbProvider(secrets.database)
//     let dbProviderId = getOrCreateProvider(providerMap, bearer, dbType, providerUrl, dbPayload)

//     console.error("getting the security provider...")
//     let secPayload = securityProvider(secrets.security)
//     let secType = "Gestalt::Configuration::Provider::Security"
//     let securityId = getOrCreateProvider(providerMap, bearer, secType, providerUrl, Some(secPayload))

//     //this one sucks, too many modes of operation, simplify
//     console.error(`getting the caas provider...${caasType}`)
//     let caasPayload = secrets.caas.map(caas =>
//         caasProvider(caas, caasType)
//     );
//     let caasTypeName = (caasType == CaaSTypes.KUBE) ? "Gestalt::Configuration::Provider::CaaS::Kubernetes" : "Gestalt::Configuration::Provider::CaaS::DCOS"
//     let caasId = getOrCreateProvider(providerMap, bearer, caasTypeName, providerUrl, caasPayload)

//     console.error("getting the rabbit provider...")
//     let rabbitPayload = rabbitProvider(secrets.rabbit)
//     let rabbitType = "Gestalt::Configuration::Provider::Messaging"
//     let rabbitId = getOrCreateProvider(providerMap, bearer, rabbitType, providerUrl, rabbitPayload)

//     console.error("creating the laser executor provider(s)...")
//     let executorType = "Gestalt::Configuration::Provider::Lambda::Executor"
//     let executorOpts = getExecutors(providerMap, executorType)
//     let executorIds = executorOpts;
//     if (!executorIds) {
//         executorIds = [];
//         for (let exec of secrets.laser.executors) {
//             let execPayload = executorPayload(exec)
//             let id = (await HttpClient.sendPost(providerUrl, execPayload, bearer, 180)).id;
//             executorIds.push(id);
//         }
//     }

//     console.error("getting the laser provider...")
//     let laserPayload = laserProvider(secrets.laser, executorIds, laserFQON, securityId, caasId, rabbitId, dbProviderId, caasType)
//     let laserId = (await HttpClient.sendPost(providerUrl, Some(laserPayload), bearer, 180)).id;
// }

// function lookupProviders(meta, bearer, fqon, envuuid) {

//     let url = `${meta}/${fqon}/environments/${envuuid}/providers`
//     let providers = await HttpClient.sendGet(url, bearer, { "expand": "true" }, 150);

//     //TODO
//     // 	providers.map { provider =>
//     //         val id = ( provider \ "id" ).as[String]
//     // 		val providerTypeName = ( provider \ "resource_type" ).get.toString.replaceAll("\"","")
//     // 		(providerTypeName, id)
//     // }.toMap
// }


// function setupGatewayProviders(meta, bearer, fqon, envuuid, secretsFile, caasType) {
//     console.error("creating gateway provider...")

//     let secrets = parseSecrets(secretsFile)

//     let providerMap = lookupProviders(meta, bearer, "root", envuuid)
//     println(`providermap = ${providerMap}`)

//     let providerUrl = `${meta}/${fqon}/environments/${envuuid}/providers`


//     console.error("lookup or create the core providers ...")

//     console.error("getting the db provider")
//     let dbType = "Gestalt::Configuration::Provider::Data::PostgreSQL"
//     let dbPayload = dbProvider(secrets.database)
//     let dbProviderId = getOrCreateProvider(providerMap, bearer, dbType, providerUrl, dbPayload)

//     console.error("getting the security provider...")
//     let secPayload = securityProvider(secrets.security)
//     let secType = "Gestalt::Configuration::Provider::Security"
//     let securityId = getOrCreateProvider(providerMap, bearer, secType, providerUrl, secPayload)

//     //this one sucks, too many modes of operation, simplify
//     console.error(`getting the caas provider...${caasType}`)
//     let caasPayload = caasProvider(secrets.caas, caasType)

//     let caasTypeName = (caasType == CaaSTypes.KUBE) ? "Gestalt::Configuration::Provider::CaaS::Kubernetes" : "Gestalt::Configuration::Provider::CaaS::DCOS"
//     let caasId = getOrCreateProvider(providerMap, bearer, caasTypeName, providerUrl, caasPayload)

//     let kongPayload = kongProvider(secrets.kong, dbProviderId, caasId, caasType)
//     let kongId = (await HttpClient.sendPost(providerUrl, kongPayload, bearer, 180)).id;

//     let apigatewayPayload = gatewayProvider(secrets.gateway, kongId, dbProviderId, caasId, securityId)
//     let apigatewayId = (await HttpClient.sendPost(providerUrl, apigatewayPayload, bearer, 180)).id;

//     console.error("Gateway providers configured...")
// }

// // 	def setupPolicyProvider(meta: String, bearer: String, fqon: String, envuuid : String) {
// // 		console.error( "creating Policy provider...")

// // 		console.error( "lookup default workspace..." )
// // 		val providerUrl = s"${meta}/${fqon}/environments/${envuuid}/providers"

// // //		val policyPayload = policyProvider( secrets.laser, executorIds, laserFQON, securityId, caasId, rabbitId, dbProviderId )
// // //		val policyId = HttpClient.sendPost( providerUrl, Some(policyPayload), bearer, 180 ).map { json => getId(json) }.get

// // 	}


