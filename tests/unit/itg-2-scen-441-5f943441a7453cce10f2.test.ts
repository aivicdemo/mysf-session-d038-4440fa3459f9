import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-441: 既存Salesforce機能と移行対象システム標準機能のマッピング情報が完全に記録されていることが検証され、次のマッピング表生成工程へ進む', () => {
  it('認証済み・manager ロール・アクティブ・必要な権限を持つユーザーが generate_mapping 操作の実行を許可される', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'manager',
        accountStatus: 'active' as const,
        userId: 'user-12345',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-migration-2026-001',
      userProjectRoles: [{ projectId: 'proj-migration-2026-001', role: 'manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-migration-2026-001');
    expect(result.denialReason).toBeNull();
  });
});
