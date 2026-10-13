import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput, VerifyUserAuthenticationAndAuthorizationOutput } from '../../src/logic/authentication-authorization';

describe('SCEN-486: 移行対象システムメタデータ取得に失敗したが前回同期済みデータが存在するとき、マッピング作業は続行可能だが最新定義との乖離があることが警告される', () => {
  it('project_managerユーザーがgenerate_mapping操作を実行する権限を持つとき、isAuthorizedがtrueで認可される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-001'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-salesforce-migration-001',
      userProjectRoles: [
        {
          projectId: 'proj-salesforce-migration-001',
          role: 'project_manager'
        }
      ]
    };

    const result: VerifyUserAuthenticationAndAuthorizationOutput = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-salesforce-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
