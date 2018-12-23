fog admin show-directories --org root

fog admin create-directory --org root -f ldap_directory.json

fog admin create-account-store --directory /root/prod-ldap-directory --org root

fog admin create-account-store --directory /root/prod-ldap-directory --org sandboxes

fog admin create-account-store --directory /root/prod-ldap-directory --org engineering

fog admin show-account-stores --org root
