import { verifyUserAuthenticationAndAuthorization, UserNotAuthenticatedException } from '../../src/logic/authentication-authorization';

describe('SCEN-450: 認証・認可検証に失敗し、APIリクエストが拒否される', () => {
  it('未認証ユーザーの generate_mapping 操作が拒否されることを確認', async () => {
    const input = {
      user: {
        authenticationStatus: 'unauthenticated' as const,
        role: 'ProjectManager',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-sf-migration-001',
      userProjectRoles: [
        { projectId: 'proj-sf-migration-001', role: 'ProjectManager' },
      ],
    };

    await expect(verifyUserAuthenticationAndAuthorization(input)).rejects.toThrow(UserNotAuthenticatedException);
  });
});
