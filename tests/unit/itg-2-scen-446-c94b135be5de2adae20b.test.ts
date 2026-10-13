import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-446: 生成された機能マッピング詳細レコードが永続化層に保存され、次のマッピング検証結果永続化工程へ進む', () => {
  it('認証済み・projectManager ロール・アクティブ・必要な権限を持つユーザーが generate_mapping 操作の実行を許可される', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'projectManager',
        accountStatus: 'active' as const,
        userId: 'user-pm-001',
      },
      operationType: 'generate_mapping',
      projectId: 'project-sfdc-migration-2026',
      userProjectRoles: [{ projectId: 'project-sfdc-migration-2026', role: 'projectManager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-pm-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-sfdc-migration-2026');
    expect(result.denialReason).toBeNull();
  });
});
