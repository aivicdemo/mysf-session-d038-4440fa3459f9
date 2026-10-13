import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-477: プロセス差分分析自動実行 - マッピング検証権限確認', () => {
  it('生成された機能マッピング詳細レコードが永続化層に保存されると、マッピング検証結果の永続化へ進む', async () => {
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
        {
          projectId: 'proj-sf-migration-001',
          role: 'project_manager',
        },
      ],
    };

    const output = await verifyUserAuthenticationAndAuthorization(input);

    expect(output).toEqual({
      isAuthorized: true,
      userId: 'user-12345',
      operationType: 'validate_mapping',
      projectId: 'proj-sf-migration-001',
      denialReason: null,
    });
  });
});
