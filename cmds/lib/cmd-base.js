
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
        handleError(err);
    }
}

function handleError(err) {
    err = JSON.parse(err.error).message;
    console.error(`Error: ${err}`);
}
