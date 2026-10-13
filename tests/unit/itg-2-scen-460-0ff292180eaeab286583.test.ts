import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-460: 各検証工程（オブジェクト定義・計算ロジック・参照関係・マッピング）の結果が、マッピング表生成に必要な入力として正確に引き継がれる', () => {
  test('認証済み・アカウント有効なadminロールユーザーがgenerate_mapping操作でプロジェクトアクセス権を持つ場合、すべての検証工程用入力を保持して認可が成功する', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'admin',
        accountStatus: 'active',
        userId: 'user-admin-001'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-sf-migration-2026',
      userProjectRoles: [{ projectId: 'proj-sf-migration-2026', role: 'admin' }]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-admin-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-sf-migration-2026');
    expect(result.denialReason).toBeNull();
  });
});
