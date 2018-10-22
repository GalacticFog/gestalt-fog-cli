const {
    getGestaltContext
} = require('./generic');

const meta = require('./metaclient');


exports.fetchPolicyRules = async (context, policySpec) => {
    let id = policySpec.id;
    if (!id) {
        const policy = await this.fetchPolicy(context, policySpec);
        id = policy.id;
    }
    return meta.GET(`/${context.org.fqon}/policies/${id}/rules?expand=true`);
}


exports.createPolicyRule = (spec, providedContext) => {
    if (!spec) throw Error('missing spec');
    if (!spec.name) throw Error('missing spec.name');
    
    // TODO: Other required parameters

    const context = providedContext || getGestaltContext();
    if (!context.org) throw Error("missing context.org");
    if (!context.org.fqon) throw Error("missing context.org.fqon");
    if (!context.policy) throw Error("missing context.policy");
    if (!context.policy.id) throw Error("missing context.policy.id");
    return meta.POST(`/${context.org.fqon}/policies/${context.policy.id}/rules`, spec);
}
