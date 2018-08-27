const meta = require('./metaclient');

exports.fetchPolicyRules = async (context, policySpec) => {
    let id = policySpec.id;
    if (!id) {
        const policy = await this.fetchPolicy(context, policySpec);
        id = policy.id;
    }
    return meta.GET(`/${context.org.fqon}/policies/${id}/rules?expand=true`);
}
