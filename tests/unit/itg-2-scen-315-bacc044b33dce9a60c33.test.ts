import {
  verifyUserAuthenticationAndAuthorization,
  VerifyUserAuthenticationAndAuthorizationInput,
  UserNotAuthenticatedException,
} from '../../src/logic/authentication-authorization';

describe('SCEN-315: ユーザーがログアウト状態またはセッション期限切れの場合', () => {
  it('認証エラーで拒否される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'unauthenticated',
        role: 'analyst',
        accountStatus: 'active',
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-migration-2026-001',
      userProjectRoles: [{ projectId: 'proj-migration-2026-001', role: 'analyst' }],
    };

    await expect(verifyUserAuthenticationAndAuthorization(input)).rejects.toThrow(
      UserNotAuthenticatedException
    );

    try {
      await verifyUserAuthenticationAndAuthorization(input);
    } catch (error) {
      expect(error).toBeInstanceOf(UserNotAuthenticatedException);
      expect((error as Error).message).toBe('ユーザーが認証されていません。ログインしてください。');
    }
  });
});
