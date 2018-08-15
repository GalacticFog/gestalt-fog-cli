# Gestalt `fog` CLI Utility

Github Repository: https://github.com/GalacticFog/gestalt-fog-cli

Client utility for Gestalt Platform (similar to `kubectl` for Kubernetes and `dcos` for DC/OS).

```
fog <command>

Commands:
  fog bash-completion      Show Bash Completion Script
  fog clone <resource>     Clone resources of specified type
  fog create <resource>    Creates resources of specified type (APIs, Containers, Lambdas, Streams, etc)
  fog delete <resource>    Delete resources of specified type
  fog describe <resource>  Describes resources of specified type
  fog export <resource>    Exports resources of specified type
  fog ext <command>        External commands
  fog import <resource>    Imports resources of specified type
  fog login                Log in to Gestalt Platform Instance
  fog logout               Logout of Gestalt Platform Instance
  fog reset-context        Reset context
  fog restart <resource>   Restart resources of specified type
  fog scale <resource>     Scale resources of specified type
  fog show <resource>      Gets resources of specified type
  fog status               Show Status
  fog switch <resource>    Switch to resource of specified type

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]

```

## Run from Source

`fog` requires node and npm for running from source.

```sh
cd gestalt-fog-cli
npm install
./fog
```

## Binary Installation from Source

Building from source bundles the nodejs engine with the `fog` code to provide a single binary with minimal external dependencies.

```
npm run build:local // or yarn build:local

# for Linux
cp ./target/linux/fog /usr/local/bin/fog

# for MacOS
cp ./target/macos/fog /usr/local/bin/fog
```

## Set up Bash Completion
```sh
fog bash-completion >> ~/.bashrc
```

## Login to Gestalt Platform
```sh
fog login                                           # Interactively
fog login <url>                                     # Prompts for username, password
fog login <url> -u <username>                       # Only prompts for password
fog login <url> -u <username> -p <password>         # No prompts
```

## Discover commands
```sh
# Help
fog --help
fog [command] --help
```

## Tab autocompletion
```sh
fog <tab, tab>
fog [command] <tab, tab>
```


# Commands
```
# Create
  fog create api-endpoint  Create API Endpoint
  fog create api           Create API
  fog create container     Create container
  fog create environment   Create environment
  fog create lambda        Create lambda
  fog create org           Create org
  fog create workspace     Create workspace

# Delete
  fog delete containers  Delete containers
  fog delete lambdas     Delete lambdas  fog describe <resource>  Describes resources of specified type

# Import / Export
  fog export environment  Export environment
  fog export root         Export root
  fog import lambda

# Login / Logout
  fog login
  fog logout

# Container actions
  fog clone containers
  fog restart containers
  fog scale container

# Show commands
  fog show api-endpoints             List API endpoints
  fog show apis                      List APIs
  fog show containers                List containers
  fog show environment-entitlements  Show environment entitlements
  fog show environments              List enviornments
  fog show group-members             List group members
  fog show groups                    List groups
  fog show lambdas                   List lambdas
  fog show org-entitlements          Show org entitlements
  fog show orgs                      List orgs
  fog show providers                 List providers
  fog show users                     List users
  fog show workspace-entitlements    Show workspace entitlements
  fog show workspaces                List workspaces

# Show commands
  fog service deploy                 Deploy a service.yml config
  fog service package                Package a service.yml config

# Show status  
  fog status               

# Switch commands
  fog switch environment  Change environment
  fog switch org          Change org
  fog switch workspace    Change workspace

# Reset context
  fog reset-context

# Extension commands
  fog ext configure-gitlab-project          Configure Gitlab project
  fog ext configure                         Configure
  fog ext container-volumes                 Container volumes
  fog ext deploy-from-docker-compose        Deploy from Docker Compose file
  fog ext elb-port-mappings                 ELB Port Mappings
  fog ext kube-container-console            Container Console (Kubernetes)
  fog ext kube-container-logs               Container logs (Kubernetes)
  fog ext kubectl                           kubectl

# Bash completion script
  fog bash-completion      Show Bash Completion Script

```

## Command Examples (Non-Interactive Commands)

### Create Org
```sh
fog create org --name 'example' --description 'Example Organization' --org root
```

### Create Workspace
```sh
fog create workspace --org 'example' --name 'example' --description 'Example Workspace'
```

### Create Environment

```sh
fog create environment --org 'example' --workspace 'example' --name 'dev' --description 'Development' --type development
```

### Create API
```sh
fog create api --org 'example' --workspace 'example' --environment 'dev' --provider 'default-kong' --name 'test-api' --description 'Test API'
```

### Create Container from Template File
```sh
fog create container -f container_template.json --org example --workspace example --environment dev --provider default-kubernetes
```

### Create API Endpoint for Container
```sh
fog create api-endpoint --name '/one' --description 'asdf' --org 'example' --workspace 'example' --environment 'dev' --api 'test-api' --provider 'default-kong' --container 'test' --port-name 'web' --methods 'GET,POST'
```

### Create Lambda from Template File
```sh
```

### Create API Endpoint for Lambda
```sh
```

### Show Containers in Current Environment
```sh
fog show containers
```
### Show Containers in the Current Org
```sh
fog show containers --org
```
### Show All Containers 
```sh
fog show containers --all
```

### Show Lambdas
```sh
fog show lambdas
```

fog show lambdas --org
fog show lambdas --all
fog show lambdas --raw



## Command Examples (Interactive)
```sh
# Show commands


# Describe single resource commands

fog describe container

fog describe lambda
fog describe lambda --fqon engineering --id c01c2296-ce76-4d41-8530-53ceb257133a

# Change current context

fog switch org
fog switch workspace
fog switch environment


# Container actions

fog scale container
fog restart containers
fog clone containers

```
