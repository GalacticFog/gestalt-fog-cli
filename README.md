# Gestalt `fog` CLI Utility

Github Repository: https://github.com/GalacticFog/gestalt-fog-cli

Client utility for Gestalt Platform (similar to `kubectl` for Kubernetes and `dcos` for DC/OS).

```
fog <command>

Commands:
  fog admin <command>       Admin commands
  fog clone <command>       Clone resources of specified type
  fog completion <command>  Shell completion commands
  fog config <command>      Config commands
  fog context <command>     Context commands
  fog create <command>      Creates resources of specified type
  fog delete <command>      Delete resources of specified type
  fog export <command>      Exports resources of specified type
  fog login                 Log in to Gestalt Platform Instance
  fog logout                Logout of Gestalt Platform Instance
  fog meta <command>        Gestalt Meta functions
  fog migrate <command>     Migrate resources of specified type
  fog promote <command>     Promote resources of specified type
  fog restart <command>     Restart resources of specified type
  fog scale <command>       Scale resources of specified type
  fog security <command>    Gestalt Security functions
  fog service <command>     service resources of specified type
  fog show <command>        Gets resources of specified type
  fog status                Show Status

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
fog completion bash >> ~/.bashrc

# Log out of your shell, and re-login

fog <tab, tab>                       # Autocomplete

fog show <tab, tab>                  # Autocomplete the command

fog create resource --f<tab, tab>    # Autocomplete the command flag

```

## Discover commands
```sh
# Help
fog --help
fog [command] --help
```

## Login to Gestalt Platform
```sh
fog login                                           # Interactively
fog login <url>                                     # Prompts for username, password
fog login <url> -u <username>                       # Only prompts for password
fog login <url> -u <username> -p <password>         # No prompts
```

## Working with Context
```sh
fog show hierarchy --raw                   # Show all context paths

fog context set /sandbox/                  # Set context to a specific org

fog context set /sandbox/dev-sandbox       # Set context to a specific workspace

fog context set /sandbox/dev-sandbox/dev   # Set context to a specific environment

fog context set                            # Select the context interactively

fog status                                 # Show the current context

```


## Showing resources
```sh
fog show orgs                                   # Show orgs

fog show workspaces /                           # Show all workspaces

fog show environments /                         # Show all environments

fog show hierarchy                              # Show all context paths (Orgs, Workspaces, Environments)

fog show providers /root                        # Show providers in /root

fog show providers --type CaaS                  # Show filtered list of providers

fog show lambdas                                # Show lambdas in the current context

fog show lambdas /                              # Show all lambdas

fog show containers                             # Show in the current context

fog show conatiners /                           # Show all

fog show containers /root                       # Show in the specified org

fog show containers /root/dev-sandbox           # Show in the specified workspace

fog show containers /root/dev-sandbox/dev       # Show from a specific environment

fog show --help  # Show other available resource types (policies, datafeeds, secrets, users, groups, etc)

```

## Creating resources
```
fog create resource -f example.yaml

fog create resource -f example.yaml --name 'override-the-name' --description 'Override the description'

fog create resource -f example.yaml --context /root/dev-sandbox/dev

fog create resource -f example.yaml --provider 'default-kubernetes'

fog create resource -f example.yaml --render-only

```


## Enabling / Disabling debug
```sh
fog config set debug=true

fog config unset debug

fog config view
```

## Container actions
```sh
fog create resource -f nginx-container-spec.json --name nginx --description 'My NGINX container'

fog scale container 'nginx' 3

fog migrate container 'nginx' /root/default-kubernetes

fog promote container 'nginx' prod

fog delete container 'nginx'

# Interactive commands

fog clone containers

fog migrate containers

fog promote containers

fog delete containers

```

# Commands List
```
fog admin <command>
  fog admin add-user-to-group               Add user to group
  fog admin apply-entitlements              Apply entitlements from file
  fog admin create-account-store [file]     Create Account Store
  fog admin create-directory [file]         Create LDAP directory
  fog admin create-group [name]             Create group
  [description]
  fog admin delete-directory [name]         Delete LDAP directory
  fog admin generate-api-key                Generate Gestalt Security API key
  fog admin list-entitlements               List entitlement actions at the
  [context_path]                            specified context
  fog admin remove-user-from-group          Remove user from group
  fog admin show-account-stores [org]       Show account stores
  fog admin show-directories [org]          Show LDAP directories
  fog admin show-directory-accounts [name]  Show LDAP directories
  fog admin show-directory-groups [name]    Show LDAP directories
  fog admin show-groups [org]               Show groups
  fog admin update-license [file]           Update Gestalt license

fog bash-completion     Show Bash Completion Script

fog clone <command>
  fog clone containers  Clone containers

fog completion <command>  Shell completion commands
  fog completion bash  Show Bash Completion Script

fog config <command>
  fog config set [args...]    Set config
  fog config unset [args...]  Unset config
  fog config view             view config

fog context <command>
  fog context get-browser-url [path]  get-browser-url
  fog context reset                   Reset context
  fog context select-environment      Change environment
  fog context select-org              Change org
  fog context select-workspace        Change workspace
  fog context set [path]              Set context

fog create <command>
  fog create api-endpoint [name]   Create API Endpoint
  fog create api [name]            Create API
  fog create container [name]      Create container
  fog create environment [name]    Create environment
  fog create lambda [name]         Create lambda
  fog create org [name]            Create org
  fog create policy-rule           Create policy rule
  fog create resource [name]       Create resource
  fog create resources [files...]  Create resources
  fog create workspace [name]      Create workspace

fog delete <command>
  fog delete container [container_name]  Delete container
  fog delete containers                  Delete containers
  fog delete lambda [lambda_name]        Delete lambda
  fog delete lambdas                     Delete lambdas
  fog delete policy [policy_name]        Delete policy

fog export <command>
  fog export environment  Export environment
  fog export root         Export root

fog login               Log in to Gestalt Platform Instance

fog logout              Logout of Gestalt Platform Instance

fog meta <command>
  fog meta DELETE [path]   HTTP functions
  fog meta GET [path]      HTTP functions
  fog meta PATCH [path]    HTTP functions
  fog meta POST [path]     HTTP functions
  fog meta PUT [path]      HTTP functions
  fog meta patch-provider  HTTP functions

fog migrate <command>
  fog migrate container [container_name]    Migrate container
  fog migrate containers                    Migrate containers

fog promote <command>
  fog promote container [container_name]    Promote container
  fog promote containers                    Promote containers

fog restart <command>
  fog restart containers  Restart containers

fog scale <command>
  fog scale container [container_name]      Scale container

fog security <command>
  fog security GET [path]           HTTP functions
  fog security PATCH [path] [file]  HTTP functions

fog service <command>
  fog service deploy   Deploy a Service
  fog service package  Package a Service

fog show <command>
  fog show api-endpoints [context_path]  List API endpoints
  fog show apis [context_path]           Show apis
  fog show containers [context_path]     Show containers
  fog show datafeeds [context_path]      Show datafeeds
  fog show entitlements [context_path]   Show entitlements
  fog show environments [context_path]   List enviornments
  fog show group-members                 List group members
  fog show groups                        List groups
  fog show hierarchy                     Show the hierarchy
  fog show lambdas [context_path]        Show lambdas
  fog show orgs                          List orgs
  fog show policies [context_path]       Show policies
  fog show policy-rules [context_path]   List policy rules
  fog show providers [context_path]      List providers
  fog show secrets [context_path]        Show secrets
  fog show streamspecs [context_path]    Show streamspecs
  fog show users                         List users
  fog show volumes [context_path]        Show volumes
  fog show workspaces [context_path]     List workspaces

fog status              Show Status
```

## Resource Templates

Resource templates can be in either JSON or YAML format.  The following template directives are supported:

```
#{Config CONFIG_KEY} - Replaces with the config value CONFIG_KEY from the --config <file> or from environment variable

#{Provider /root/provider-name id} - Replaces with the ID of the named provider

#{Lambda /root/workspace/env/lambda-name id} - Replaces with the ID of the named lambda

#{Environment /root/workspace/env id} - Replaces with the ID of the named environment

```

Example Usage:

```
# The following gets replaced with the ID of the provider 'default-laser'
...
        "provider": {
            "id": "#{Provider /root/default-laser id}",
            "locations": []
        },
...


fog create resource -f template.json      # Creates the resource from template

fog create resource -f template.json --config config.yaml      # Creates the resource from template, using a config file for paramters

```
