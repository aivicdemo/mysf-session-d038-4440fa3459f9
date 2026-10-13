import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-459: APIリクエストから解決したプロジェクトコンテキストが、すべての後続工程に正確に引き継がれる', () => {
  test('認証済み・アカウント有効なadminロールユーザーがgenerate_mapping操作でプロジェクトアクセス権を持つ場合、プロジェクトコンテキストをすべて保持して認可が成功する', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'admin',
        accountStatus: 'active',
        userId: 'user-admin-001'
      },
      operationType: 'generate_mapping',
      projectId: 'project-salesforce-001',
      userProjectRoles: [{ projectId: 'project-salesforce-001', role: 'admin' }]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-admin-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-salesforce-001');
    expect(result.denialReason).toBeNull();
  });
});
