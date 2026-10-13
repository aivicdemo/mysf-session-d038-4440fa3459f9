import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-452: Insufficient permission for generate_mapping operation', () => {
  it('should return isAuthorized=false when analyst role lacks generate_mapping permission', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'analyst',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-billing-001',
      userProjectRoles: [
        { projectId: 'proj-billing-001', role: 'analyst' },
      ],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(false);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-billing-001');
    expect(result.denialReason).toBe('この操作を実行する権限がありません。');
  });
});
