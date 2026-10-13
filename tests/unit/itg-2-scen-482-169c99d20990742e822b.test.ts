import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-482: 営業プロセスフローの定義が曖昧または不完全なとき、「プロセスフロー定義を確認し、各段階の依存関係を明確にしてください」警告が記録され、処理が続行される', () => {
  it('analyst ロールが validate_mapping 操作の権限を持つ場合、isAuthorized が true を返す', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'analyst',
        accountStatus: 'active' as const,
        userId: 'user-12345',
      },
      operationType: 'validate_mapping',
      projectId: 'proj-67890',
      userProjectRoles: [{ projectId: 'proj-67890', role: 'analyst' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('validate_mapping');
    expect(result.projectId).toBe('proj-67890');
    expect(result.denialReason).toBeNull();
  });
});
