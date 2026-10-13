import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-472: verifyUserAuthenticationAndAuthorization - business logic mapping to target system features', () => {
  it('should return isAuthorized true for authenticated user with project_manager role and project access', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-12345'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-migration-001',
      userProjectRoles: [
        {
          projectId: 'proj-migration-001',
          role: 'project_manager'
        }
      ]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
