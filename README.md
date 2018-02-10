# Gestalt `fog` CLI Utility

Github Repository: https://github.com/GalacticFog/gestalt-fog-cli

Client utility for Gestalt Platform (similar to `kubectl` for Kubernetes and `dcos` for DC/OS).

```
fog <command>

Commands:
  fog bash-completion      Show Bash Completion Script
  fog clone <resource>     Clone resources of specified type
  fog create <resource>    Creates resources of specified type
  fog delete <resource>    Delete resources of specified type
  fog describe <resource>  Describes resources of specified type
  fog ext <command>        External commands
  fog login                Log in to Gestalt Platform Instance
  fog logout               Logout of Gestalt Platform Instance
  fog reset-context        Reset context
  fog restart <resource>   Restart resources of specified type
  fog scale <resource>     Scale resources of specified type
  fog show-context         Show context
  fog show <resource>      Gets resources of specified type
  fog status               Show Status
  fog switch <resource>    Switch to resource of specified type

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]

```

## Run

`fog` requires node and npm for running from source.

```sh
cd gestalt-fog-cli
npm install
./fog
```

## Binary Installation from Source

Building from source bundles the nodejs engine with the `fog` code to provide a single binary with minimal external dependencies.

```sh
cd gestalt-fog-cli
npm install

# Build
npm install pkg -g
pkg .

# For MacOS
mv fog-macos /usr/local/bin/fog

# For Linux
mv fog-linux /usr/local/bin/fog

# For Windows
move fog-win.exe \Somewhere\In\Path\fog.exe
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
