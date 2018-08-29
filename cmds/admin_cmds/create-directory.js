const gestalt = require('../lib/gestalt')
const cmd = require('../lib/cmd-base');
const out = console.log;
const util = require('../lib/util');
const { debug } = require('../lib/debug');
const { directorySchema } = require('../../schemas');
const security = require('../lib/gestalt/securityclient');

exports.command = 'create-directory [file]';
exports.description = 'Create LDAP directory';

exports.builder = {
    file: {
        alias: 'f',
        description: 'patch definition file',
        required: true
    },

    org: {
        definition: 'Org to create directory against',
        required: true
    }
}

exports.handler = cmd.handler(async function (argv) {
    const fqon = argv.org;

    out(`Loading directory spec from file ${argv.file}`);
    const spec = util.loadObjectFromFile(argv.file);

    debug('Directory Spec:')
    debug(spec);

    try {
        directorySchema.validateSync(spec);
    } catch (err) {

        out();
        out('Failed to load file, format does not pass schema validation.');
        out();

        const template = `{
            "name": "prod-ldap-directory",
            "directoryType": "LDAP",
            "config": {
              "activeDirectory": false,
              "userObjectClass": "person",
              "primaryField": "mail",
              "emailField": "mail",
              "descriptionField": "cn",
              "lastNameField": "sn",
              "firstNameField": "givenName",
              "groupObjectClass": "groupOfNames",
              "groupField": "cn",
              "groupDescriptionField": "description",
              "memberField": "member",
              "groupSearchBase":               "cn=groups,cn=accounts,dc=example,dc=com",
              "accountSearchBase":              "cn=users,cn=accounts,dc=example,dc=com",
              "systemUsername": "uid=sa.galacticfog,cn=users,cn=accounts,dc=example,dc=com",
              "systemPassword": "<<PASSWORD>>",
              "url": "ldaps://ldap.example.com:636/"
            }
          }`
          out("Example payload: " + template);
          throw err;
    }

    const response = await security.POST(`/${fqon}/directories`, spec);
    debug(response);
    out(`Created directory '${response.name}' (${response.id})`);
});
