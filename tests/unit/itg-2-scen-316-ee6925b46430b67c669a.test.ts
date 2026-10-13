import {
  verifyUserAuthenticationAndAuthorization,
  VerifyUserAuthenticationAndAuthorizationInput,
  UserAccountInactiveException,
} from '../../src/logic/authentication-authorization';

describe('SCEN-316: ユーザーアカウントが無効化・削除・停止状態の場合', () => {
  it('アカウント無効エラーで拒否される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'inactive',
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'project-sf-001',
      userProjectRoles: [{ projectId: 'project-sf-001', role: 'project_manager' }],
    };

    await expect(verifyUserAuthenticationAndAuthorization(input)).rejects.toThrow(
      UserAccountInactiveException
    );

    try {
      await verifyUserAuthenticationAndAuthorization(input);
    } catch (error) {
      expect(error).toBeInstanceOf(UserAccountInactiveException);
      expect((error as Error).message).toBe(
        'ユーザーアカウントが無効です。システム管理者に連絡してください。'
      );
    }
  });
});
