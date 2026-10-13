import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-474: verifyUserAuthenticationAndAuthorization - gap analysis scoring', () => {
  it('should return isAuthorized true when user has authorization for gap analysis', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-001'
      },
      operationType: 'generate_mapping',
      projectId: 'project-sf-migration-001',
      userProjectRoles: [
        {
          projectId: 'project-sf-migration-001',
          role: 'project_manager'
        }
      ]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-sf-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
