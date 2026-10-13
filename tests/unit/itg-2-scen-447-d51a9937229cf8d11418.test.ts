import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-447: マッピング検証結果がギャップ分析・対応可否判定で永続化される', () => {
  it('project_manager ユーザーが validate_mapping 操作を実行できることを確認', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'project_manager',
        accountStatus: 'active' as const,
        userId: 'user-12345',
      },
      operationType: 'validate_mapping',
      projectId: 'proj-sf-migration-001',
      userProjectRoles: [
        { projectId: 'proj-sf-migration-001', role: 'project_manager' },
      ],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('validate_mapping');
    expect(result.projectId).toBe('proj-sf-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
