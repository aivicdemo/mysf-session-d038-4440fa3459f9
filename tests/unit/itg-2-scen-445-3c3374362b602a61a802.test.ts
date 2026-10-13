import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-445: マッピング検証結果とギャップ分類から移行リスク要因が抽出・評価され、リスク評価スコアが算出され、次の機能マッピング詳細永続化工程へ進む', () => {
  it('認証済み・project_manager ロール・アクティブ・必要な権限を持つユーザーが generate_mapping 操作の実行を許可される', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'project_manager',
        accountStatus: 'active' as const,
        userId: 'user-pm-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-sf-replace-001',
      userProjectRoles: [{ projectId: 'proj-sf-replace-001', role: 'project_manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-pm-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-sf-replace-001');
    expect(result.denialReason).toBeNull();
  });
});
