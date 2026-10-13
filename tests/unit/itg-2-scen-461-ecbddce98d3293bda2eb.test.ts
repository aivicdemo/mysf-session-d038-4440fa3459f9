import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-461: マッピング表生成で生成された結果が、ギャップ分析工程に正確に引き継がれる', () => {
  test('認証済み・アカウント有効なprojectManagerロールユーザーがgenerate_mapping操作でプロジェクトアクセス権を持つ場合、すべての出力フィールドを確認できる', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'projectManager',
        accountStatus: 'active',
        userId: 'user-pm-001'
      },
      operationType: 'generate_mapping',
      projectId: 'project-salesforce-001',
      userProjectRoles: [{ projectId: 'project-salesforce-001', role: 'projectManager' }]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-pm-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-salesforce-001');
    expect(result.denialReason).toBeNull();
  });
});
