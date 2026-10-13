import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-466: APIリクエスト送信者がプロセス差分分析実行権限を持たないと、処理が拒否される', () => {
  it('should return authorized=false with InsufficientRolePermissionException message when user has insufficient role', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'analyst',
        accountStatus: 'active' as const,
        userId: 'user-12345',
      },
      operationType: 'analyze_process_diff',
      projectId: 'project-67890',
      userProjectRoles: [{ projectId: 'project-67890', role: 'viewer' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(false);
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('analyze_process_diff');
    expect(result.projectId).toBe('project-67890');
    expect(result.denialReason).toBe('この操作を実行する権限がありません。');
  });
});
