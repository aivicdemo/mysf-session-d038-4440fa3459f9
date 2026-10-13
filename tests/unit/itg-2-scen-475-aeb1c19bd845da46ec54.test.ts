import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-475: プロセス差分分析自動実行 - ユーザー認証・認可検証', () => {
  it('検出されたギャップが分類され、移行実現可能性を定量的に評価するスコアが算出されると、移行リスク評価へ進む', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'analyst',
        accountStatus: 'active' as const,
        userId: 'user-12345',
      },
      operationType: 'view_dashboard',
      projectId: 'proj-sf-migration-001',
      userProjectRoles: [
        {
          projectId: 'proj-sf-migration-001',
          role: 'analyst',
        },
      ],
    };

    const output = await verifyUserAuthenticationAndAuthorization(input);

    expect(output).toEqual({
      isAuthorized: true,
      userId: 'user-12345',
      operationType: 'view_dashboard',
      projectId: 'proj-sf-migration-001',
      denialReason: null,
    });
  });
});
