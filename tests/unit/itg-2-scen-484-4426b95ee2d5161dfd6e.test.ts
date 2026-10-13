import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-484: Salesforceメタデータ取得に失敗したが前回同期済みデータが存在するとき、マッピング作業は続行可能だが最新定義との乖離があることが警告される', () => {
  it('authenticatedユーザー（analyst）がgenerate_mapping操作を実行する権限を持つとき、isAuthorizedがtrueで認可される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'analyst',
        accountStatus: 'active',
        userId: 'user-12345'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-sf-migration-001',
      userProjectRoles: [
        {
          projectId: 'proj-sf-migration-001',
          role: 'analyst'
        }
      ]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-sf-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
