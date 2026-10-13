import { verifyUserAuthenticationAndAuthorization, UserNotAuthenticatedException, VerifyUserAuthenticationAndAuthorizationInput } from '../../src/logic/authentication-authorization';

describe('SCEN-468: verifyUserAuthenticationAndAuthorization - migration project context resolution fails', () => {
  it('should throw UserNotAuthenticatedException when user is unauthenticated', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'unauthenticated',
        role: 'analyst',
        accountStatus: 'active',
        userId: 'user-001'
      },
      operationType: 'generate_mapping',
      projectId: 'proj-001',
      userProjectRoles: [
        {
          projectId: 'proj-001',
          role: 'analyst'
        }
      ]
    };

    await expect(verifyUserAuthenticationAndAuthorization(input)).rejects.toThrow(
      expect.objectContaining({
        message: 'ユーザーが認証されていません。ログインしてください。'
      })
    );
  });
});
