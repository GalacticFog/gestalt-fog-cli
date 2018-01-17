
exports.handler = function (main) {
    return function (argv) {
        run(main, argv).then(() => {
            // Post
        });
    }
}

async function run(fn, argv) {
    try {
        await fn(argv);
    } catch (err) {
        handleError(argv, err);
    }
}

function handleError(argv, err) {
    if (argv.debug) {
        console.log(err)
    } else {
        try {
            const json = JSON.parse(err);
            if (json) {
                if (json.message) {
                    console.error(json.message);
                } else {
                    console.error(`Error: ${err}`);
                }
            } else {
                console.error(`Error: ${err}`);
            }
        } catch (err2) {
            // Failed to parse
            console.error(`Error: ${err}`);
        }
    }

    console.error(`Try running 'fog configure'`);
}
