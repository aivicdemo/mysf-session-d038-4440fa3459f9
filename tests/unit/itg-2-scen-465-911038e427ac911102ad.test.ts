import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-465: APIリクエスト送信者の認証に失敗すると、処理が中断される', () => {
  it('should return authorized=false with denialReason when user is unauthenticated', async () => {
    const input = {
      user: {
        authenticationStatus: 'unauthenticated' as const,
        role: 'analyst',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-billing-001',
      userProjectRoles: [{ projectId: 'proj-billing-001', role: 'analyst' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(false);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-billing-001');
    expect(result.denialReason).toBe('ユーザーが認証されていません。ログインしてください。');
  });
});
