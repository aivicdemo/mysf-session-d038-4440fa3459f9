import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-457: ギャップスコアが80以上かつ必須機能であり、移行リスク高い旨の警告が表示される', () => {
  test('認証済み・アカウント有効なproject_managerロールユーザーがgenerate_mapping操作でプロジェクトアクセス権を持つ場合、認可が成功する', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-001'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-001',
      userProjectRoles: [{ projectId: 'proj-001', role: 'project_manager' }]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-001');
    expect(result.denialReason).toBeNull();
  });
});
