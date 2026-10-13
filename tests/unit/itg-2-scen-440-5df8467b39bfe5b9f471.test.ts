import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-440: オブジェクト間参照関係の整合性が検証され、TCO試算に必要なデータ依存関係が正確に把握されていることが確認され、次の標準機能マッピング検証工程へ進む', () => {
  it('認証済み・アクティブ・必要な権限を持つユーザーが generate_mapping 操作の実行を許可される', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'project_manager',
        accountStatus: 'active' as const,
        userId: 'user-12345',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-salesforce-001',
      userProjectRoles: [{ projectId: 'proj-salesforce-001', role: 'project_manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-salesforce-001');
    expect(result.denialReason).toBeNull();
  });
});
