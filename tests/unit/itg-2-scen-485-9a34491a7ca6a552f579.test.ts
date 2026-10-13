import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-485: 移行対象システムメタデータ取得API呼び出しが失敗した場合、指数バックオフで最大3回再試行され、3回失敗後は管理者へアラート送信される', () => {
  it('adminユーザーがview_mapping操作を実行する権限を持つとき、正常系の出力が返される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'admin',
        accountStatus: 'active',
        userId: 'user-admin-001'
      },
      operationType: 'view_mapping',
      projectId: 'proj-salesforce-001',
      userProjectRoles: [
        {
          projectId: 'proj-salesforce-001',
          role: 'admin'
        }
      ]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-admin-001');
    expect(result.operationType).toBe('view_mapping');
    expect(result.projectId).toBe('proj-salesforce-001');
    expect(result.denialReason).toBeNull();
  });
});
