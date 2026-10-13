import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-454: Accounting analyst authorized for generate_mapping', () => {
  it('should return isAuthorized=true for accounting_analyst role', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'accounting_analyst',
        accountStatus: 'active' as const,
        userId: 'user-acct-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-sf-migration-001',
      userProjectRoles: [
        { projectId: 'proj-sf-migration-001', role: 'accounting_analyst' },
      ],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-acct-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-sf-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
