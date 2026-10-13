import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';
import type { VerifyUserAuthenticationAndAuthorizationInput } from '../../src/logic/authentication-authorization';

describe('SCEN-487: verifyUserAuthenticationAndAuthorization - authorization for billing project', () => {
  it('should return isAuthorized=true with all required fields when user is authenticated with project access', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'admin',
        accountStatus: 'active',
        userId: 'user-001'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-billing-001',
      userProjectRoles: [{ projectId: 'proj-billing-001', role: 'admin' }]
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-billing-001');
    expect(result.denialReason).toBeNull();
  });
});
