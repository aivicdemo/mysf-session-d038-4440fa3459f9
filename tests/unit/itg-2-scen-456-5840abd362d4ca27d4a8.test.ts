import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-456: 既存機能の仕様が不完全または不明確であり、詳細確認の警告が表示される', () => {
  test('認証済み・アカウント有効なanalystロールユーザーがgenerate_mapping操作でプロジェクトアクセス権を持つ場合、認可が成功する', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'analyst',
        accountStatus: 'active',
        userId: 'user-001'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-456',
      userProjectRoles: [{ projectId: 'proj-456', role: 'analyst' }]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-456');
    expect(result.denialReason).toBeNull();
  });
});
