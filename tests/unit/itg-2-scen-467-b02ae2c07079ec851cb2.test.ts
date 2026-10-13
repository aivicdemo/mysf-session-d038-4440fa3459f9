import { verifyUserAuthenticationAndAuthorization, UserNotAuthenticatedException, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-467: verifyUserAuthenticationAndAuthorization - successful project context resolution', () => {
  it('should return isAuthorized true when user is authenticated, project_manager role, active account, and has project access', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-001'
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
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
