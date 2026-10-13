import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-490: ファイル保存に失敗した場合、ユーザーはローカルPCにファイルをダウンロード可能である', () => {
  it('analystロールのauthenticatedユーザーがgenerate_mapping操作を実行する権限を持つとき、isAuthorizedがtrueで認可される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'analyst',
        accountStatus: 'active',
        userId: 'user-123'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-456',
      userProjectRoles: [
        {
          projectId: 'proj-456',
          role: 'analyst'
        }
      ]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-123');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-456');
    expect(result.denialReason).toBeNull();
  });
});
