import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-480: プロセス差分分析自動実行の操作履歴が監査証跡として記録されると、処理が完了する', () => {
  it('admin ロールがすべての権限要件を満たす場合、isAuthorized が true を返す', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'admin',
        accountStatus: 'active' as const,
        userId: 'user-12345',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-migration-001',
      userProjectRoles: [{ projectId: 'proj-migration-001', role: 'admin' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
