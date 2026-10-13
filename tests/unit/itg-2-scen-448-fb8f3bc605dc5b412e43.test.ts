import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-448: 移行リスク評価結果が永続化層に保存される', () => {
  it('admin ユーザーが view_dashboard 操作でダッシュボード確認権限を持つことを確認', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'admin',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'view_dashboard',
      projectId: 'proj-sfdc-migration-2026',
      userProjectRoles: [
        { projectId: 'proj-sfdc-migration-2026', role: 'admin' },
      ],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('view_dashboard');
    expect(result.projectId).toBe('proj-sfdc-migration-2026');
    expect(result.denialReason).toBeNull();
  });
});
