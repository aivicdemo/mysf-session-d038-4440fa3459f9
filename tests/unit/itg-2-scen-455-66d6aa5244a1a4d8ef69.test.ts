import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-455: Analyst authorized for generate_mapping with large feature set', () => {
  it('should return isAuthorized=true for analyst role with all required conditions met', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'analyst',
        accountStatus: 'active' as const,
        userId: 'user-analyst-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-salesforce-migration-001',
      userProjectRoles: [
        { projectId: 'proj-salesforce-migration-001', role: 'analyst' },
      ],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-analyst-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-salesforce-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
