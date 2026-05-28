using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace FalFul.API.Authorization;

public class PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
    : DefaultAuthorizationPolicyProvider(options)
{
    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName.StartsWith("Perm:", StringComparison.OrdinalIgnoreCase))
        {
            var permission = policyName[5..];
            return new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireAssertion(ctx => ctx.User.HasClaim("permission", permission))
                .Build();
        }

        return await base.GetPolicyAsync(policyName);
    }
}
