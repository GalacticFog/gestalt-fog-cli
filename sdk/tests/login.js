const { gestalt, actions } = require('..');

global.fog = { debug: true };

test();

async function test() {
    console.log('hi')

    try {
        gestalt.configure({
            gestalt_url: 'dummy',
            meta_url: 'http://localhost:31112/meta',
            security_url: 'http://localhost:31112/security',
        })

        const res = await gestalt.login({
            username: 'admin',
            password: 'gestaltpoc!'
        });

        console.log(res);

        console.log(await gestalt.fetchOrgFqons());
    } catch (err) {
        console.log(err)
    }
}