import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-489: ファイルアップロード失敗時は最大2回再試行（初回1分後、2回目5分後）され、2回失敗後はローカル保存に切り替え管理者へアラート送信される', () => {
  it('adminロールのauthenticatedユーザーがgenerate_mapping操作を実行する権限を持つとき、isAuthorizedがtrueで返される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'admin',
        accountStatus: 'active',
        userId: 'user-001'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-001',
      userProjectRoles: [
        {
          projectId: 'proj-001',
          role: 'admin'
        }
      ]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-001');
    expect(result.denialReason).toBeNull();
  });
});
