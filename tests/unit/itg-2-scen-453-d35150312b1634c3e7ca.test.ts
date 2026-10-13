import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-453: Authorized user for generate_mapping operation', () => {
  it('should return isAuthorized=true when analyst has permission for generate_mapping', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'analyst',
        accountStatus: 'active' as const,
        userId: 'user-002',
      },
      operationType: 'generate_mapping',
      projectId: 'project-billing-001',
      userProjectRoles: [
        { projectId: 'project-billing-001', role: 'analyst' },
      ],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-002');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-billing-001');
    expect(result.denialReason).toBeNull();
  });
});
