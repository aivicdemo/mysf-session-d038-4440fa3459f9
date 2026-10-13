import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-443: 生成されたマッピング表に対するギャップ分析が実施され、完全対応・部分対応・カスタマイズ必要・非対応が自動分類・スコア化され、次のギャップ分類・スコア算出工程へ進む', () => {
  it('認証済み・project_manager ロール・アクティブ・必要な権限を持つユーザーが generate_mapping 操作の実行を許可される', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'project_manager',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-sfdc-migration-001',
      userProjectRoles: [{ projectId: 'proj-sfdc-migration-001', role: 'project_manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-sfdc-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
