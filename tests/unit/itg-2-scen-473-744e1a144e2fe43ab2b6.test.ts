import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-473: verifyUserAuthenticationAndAuthorization - feature mapping table generation', () => {
  it('should return isAuthorized true when user generates feature mapping table', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-12345'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-salesforce-migration-001',
      userProjectRoles: [
        {
          projectId: 'proj-salesforce-migration-001',
          role: 'project_manager'
        }
      ]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.denialReason).toBeNull();
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-salesforce-migration-001');
  });
});
