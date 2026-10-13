import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-488: 通知送信に失敗してもマッピング操作自体は成功し、内部ログに記録される', () => {
  it('projectManagerロールのauthenticatedユーザーがgenerate_mapping操作を実行する権限を持つとき、認可判定が完了する', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'projectManager',
        accountStatus: 'active',
        userId: 'user-001'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-sf-migration-001',
      userProjectRoles: [
        {
          projectId: 'proj-sf-migration-001',
          role: 'projectManager'
        }
      ]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-sf-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
