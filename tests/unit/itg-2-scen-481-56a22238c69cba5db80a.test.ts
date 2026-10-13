import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-481: 移行対象システムの標準機能仕様が提供されていないとき、「移行対象システムの機能仕様書が必要です」エラーが発生し処理が中断される', () => {
  it('移行対象システムの標準機能仕様が提供されていない場合、isAuthorized が false で適切な denialReason が返される', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'project_manager',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'project-sfdc-to-oracle-001',
      userProjectRoles: [{ projectId: 'project-sfdc-to-oracle-001', role: 'project_manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(false);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-sfdc-to-oracle-001');
    expect(result.denialReason).toBe('移行対象システムの機能仕様書が必要です');
  });
});
