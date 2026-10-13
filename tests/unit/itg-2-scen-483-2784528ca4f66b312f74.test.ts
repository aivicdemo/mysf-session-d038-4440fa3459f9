import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';
import type { VerifyUserAuthenticationAndAuthorizationInput } from '../../src/logic/authentication-authorization';

describe('SCEN-483: verifyUserAuthenticationAndAuthorization - successful authorization with valid credentials', () => {
  it('should return isAuthorized=true and denialReason=null when user is authenticated, active, admin role, and has access to project', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'admin',
        accountStatus: 'active',
        userId: 'test-user-id'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-001',
      userProjectRoles: [{ projectId: 'proj-001', role: 'admin' }]
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('test-user-id');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-001');
    expect(result.denialReason).toBeNull();
  });
});
