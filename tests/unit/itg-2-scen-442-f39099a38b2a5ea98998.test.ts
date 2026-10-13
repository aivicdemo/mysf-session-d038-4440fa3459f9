import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-442: Salesforceカスタムオブジェクト構造・計算ロジック・参照関係から、移行対象システムの標準機能との対応マッピング表が生成され、次のマッピング検証・ギャップ分析工程へ進む', () => {
  it('認証済み・project_manager ロール・アクティブ・必要な権限を持つユーザーが generate_mapping 操作の実行を許可される', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'project_manager',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-sf-migration-001',
      userProjectRoles: [{ projectId: 'proj-sf-migration-001', role: 'project_manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-sf-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
