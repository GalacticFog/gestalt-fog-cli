const {
    getgestaltSession
} = require('./generic');

const { fetchPolicy } = require('./policy');

const meta = require('./metaclient');


exports.fetchPolicyRules = async (policySpec, context) => {
    let id = policySpec.id;
    if (!id) {
        const policy = await fetchPolicy(policySpec, context);
        id = policy.id;
    }
    return meta.GET(`/${context.org.fqon}/policies/${id}/rules?expand=true`);
}


exports.createPolicyRule = (spec, context) => {
    if (!spec) throw Error('missing spec');
    if (!spec.name) throw Error('missing spec.name');

    // TODO: Other required parameters

    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.policy) throw Error("missing context.policy");
    if (!context.policy.id) throw Error("missing context.policy.id");
    return meta.POST(`/${context.org.fqon}/policies/${context.policy.id}/rules`, spec);
}
