import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-462: ギャップ分析・分類・スコア算出の結果が、移行リスク評価工程に正確に引き継がれる', () => {
  test('認証済み・アカウント有効なproject_managerロールユーザーがview_dashboard操作でプロジェクトアクセス権を持つ場合、ダッシュボードへのアクセスが認可される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-001'
      },
      operationType: 'view_dashboard',
      projectId: 'proj-migration-001',
      userProjectRoles: [{ projectId: 'proj-migration-001', role: 'project_manager' }]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('view_dashboard');
    expect(result.projectId).toBe('proj-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
