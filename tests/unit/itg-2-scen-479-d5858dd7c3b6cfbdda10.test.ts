import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-479: プロセス差分分析に伴う移行リスク評価が永続化層に保存されると、操作履歴の監査証跡記録へ進む', () => {
  it('プロジェクトマネージャーが generate_mapping 操作を実行する権限を持つ場合、isAuthorized が true を返す', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'project_manager',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-479',
      userProjectRoles: [{ projectId: 'proj-479', role: 'project_manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-479');
    expect(result.denialReason).toBeNull();
  });
});
