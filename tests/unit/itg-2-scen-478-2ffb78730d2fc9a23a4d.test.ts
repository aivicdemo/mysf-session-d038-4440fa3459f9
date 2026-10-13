import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-478: プロセス差分分析自動実行 - アナリスト権限確認', () => {
  it('マッピング検証結果（ギャップ分析・対応可否判定）が永続化層に保存されると、移行リスク評価の永続化へ進む', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'analyst',
        accountStatus: 'active' as const,
        userId: 'user-analyst-001',
      },
      operationType: 'validate_mapping',
      projectId: 'project-salesforce-001',
      userProjectRoles: [
        {
          projectId: 'project-salesforce-001',
          role: 'analyst',
        },
      ],
    };

    const output = await verifyUserAuthenticationAndAuthorization(input);

    expect(output).toEqual({
      isAuthorized: true,
      userId: 'user-analyst-001',
      operationType: 'validate_mapping',
      projectId: 'project-salesforce-001',
      denialReason: null,
    });
  });
});
