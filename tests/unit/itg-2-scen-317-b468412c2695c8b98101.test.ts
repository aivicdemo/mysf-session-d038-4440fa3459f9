import {
  verifyUserAuthenticationAndAuthorization,
  VerifyUserAuthenticationAndAuthorizationInput,
  InsufficientRolePermissionException,
} from '../../src/logic/authentication-authorization';

describe('SCEN-317: ユーザーのロールが要求された操作に必要な権限を持たない場合', () => {
  it('ロール権限不足エラーで拒否される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'viewer',
        accountStatus: 'active',
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'project-sf-001',
      userProjectRoles: [{ projectId: 'project-sf-001', role: 'viewer' }],
    };

    await expect(verifyUserAuthenticationAndAuthorization(input)).rejects.toThrow(
      InsufficientRolePermissionException
    );

    try {
      await verifyUserAuthenticationAndAuthorization(input);
    } catch (error) {
      expect(error).toBeInstanceOf(InsufficientRolePermissionException);
      expect((error as Error).message).toBe('この操作を実行する権限がありません。');
    }
  });
});
