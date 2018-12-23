const { object, string, boolean } = require('yup');

module.exports = object().shape({
  name: string().required(),
  directoryType: string().required(),
  config: object().shape({
    activeDirectory: boolean().required(),
    userObjectClass: string().required(),
    primaryField: string().required(),
    emailField: string().required(),
    descriptionField: string().required(),
    lastNameField: string().required(),
    firstNameField: string().required(),
    groupObjectClass: string().required(),
    groupField: string().required(),
    groupDescriptionField: string().required(),
    memberField: string().required(),
    groupSearchBase: string().required(),
    accountSearchBase: string().required(),
    systemUsername: string().required(),
    systemPassword: string().required(),
    url: string().required()
  })
});


// {
//   "name": "prod-ldap-directory",
//   "directoryType": "LDAP",
//   "config": {
//     "activeDirectory": false,
//     "userObjectClass": "person",
//     "primaryField": "mail",
//     "emailField": "mail",
//     "descriptionField": "cn",
//     "lastNameField": "sn",
//     "firstNameField": "givenName",
//     "groupObjectClass": "groupOfNames",
//     "groupField": "cn",
//     "groupDescriptionField": "description",
//     "memberField": "member",
//     "groupSearchBase":               "cn=groups,cn=accounts,dc=example,dc=com",
//     "accountSearchBase":              "cn=users,cn=accounts,dc=example,dc=com",
//     "systemUsername": "uid=sa.galacticfog,cn=users,cn=accounts,dc=example,dc=com",
//     "systemPassword": "<<PASSWORD>>",
//     "url": "ldaps://ldap.example.com:636/"
//   }
// }
