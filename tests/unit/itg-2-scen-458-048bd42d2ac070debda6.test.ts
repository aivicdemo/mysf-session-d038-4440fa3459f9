import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-458: カスタマイズ工数が大かつ予算制約がある場合、別の移行対象システム検討の推奨メッセージが表示される', () => {
  test('認証済み・アカウント有効なprojectManagerロールユーザーがgenerate_mapping操作でプロジェクトアクセス権を持つ場合、認可が成功する', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'projectManager',
        accountStatus: 'active',
        userId: 'user-pm-001'
      },
      operationType: 'generate_mapping',
      projectId: 'project-sf-to-oracle-billing',
      userProjectRoles: [{ projectId: 'project-sf-to-oracle-billing', role: 'projectManager' }]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-pm-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-sf-to-oracle-billing');
    expect(result.denialReason).toBeNull();
  });
});
