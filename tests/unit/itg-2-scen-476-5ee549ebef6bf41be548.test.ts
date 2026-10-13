import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-476: プロセス差分分析自動実行 - プロジェクトマネージャー認証', () => {
  it('プロセス差分分析結果に基づき、移行リスク要因が評価され、発生可能性・影響度・対応方針が判定されると、マッピング詳細の永続化へ進む', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'project_manager',
        accountStatus: 'active' as const,
        userId: 'user-pm-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-salesforce-001',
      userProjectRoles: [
        {
          projectId: 'proj-salesforce-001',
          role: 'project_manager',
        },
      ],
    };

    const output = await verifyUserAuthenticationAndAuthorization(input);

    expect(output).toEqual({
      isAuthorized: true,
      userId: 'user-pm-001',
      operationType: 'generate_mapping',
      projectId: 'proj-salesforce-001',
      denialReason: null,
    });
  });
});
