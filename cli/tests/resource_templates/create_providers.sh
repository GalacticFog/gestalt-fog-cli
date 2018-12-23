env

if [ -z $DEBUG ]; then
    opts=''
else
    opts='--debug'
fi

if [ -z $SKIP_PROVIDER_CREATION ]; then
    fog context set --path /root $opts

    fog meta POST /root/licenses -f license.json $opts
    # fog meta update-license -f license.json

    fog create workspace --name gestalt-system-workspace -d "Gestalt System Workspace" $opts

    fog create environment -w gestalt-system-workspace -n gestalt-laser-environment -d "Gestalt Laser Environment" -t production $opts

    fog create resource -f db-provider.json --config config.json $opts

    fog create resource -f security-provider.json --config config.json $opts

    fog create resource -f kubernetes-provider.json --config config.json $opts

    fog create resource -f rabbit-provider.json --config config.json $opts

    fog create resource -f logging-provider.json --config config.json $opts

    fog meta patch-provider --provider /root/default-kubernetes -f link-logging-provider.json $opts

    # Executors
    fog create resource -f js-executor.json --config config.json $opts
    fog create resource -f jvm-executor.json --config config.json $opts
    fog create resource -f dotnet-executor.json --config config.json $opts
    fog create resource -f golang-executor.json --config config.json $opts
    fog create resource -f nodejs-executor.json --config config.json $opts
    fog create resource -f python-executor.json --config config.json $opts
    fog create resource -f ruby-executor.json --config config.json $opts


    fog create resource -f laser-provider.json --config config.json $opts

    fog create resource -f policy-provider.json --config config.json $opts

    fog create resource -f kong-provider.json --config config.json $opts

    fog create resource -f gatewaymanager-provider.json --config config.json $opts
fi
