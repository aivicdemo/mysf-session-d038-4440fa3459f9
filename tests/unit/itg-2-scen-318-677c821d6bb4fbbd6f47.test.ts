import {
  verifyUserAuthenticationAndAuthorization,
  VerifyUserAuthenticationAndAuthorizationInput,
  ProjectAccessDeniedException,
} from '../../src/logic/authentication-authorization';

describe('SCEN-318: ユーザーが対象プロジェクトへのアクセス権を持たない場合', () => {
  it('プロジェクトアクセス拒否エラーで拒否される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'analyst',
        accountStatus: 'active',
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'project-alpha',
      userProjectRoles: [
        { projectId: 'project-beta', role: 'project_manager' },
        { projectId: 'project-gamma', role: 'analyst' },
      ],
    };

    await expect(verifyUserAuthenticationAndAuthorization(input)).rejects.toThrow(
      ProjectAccessDeniedException
    );

    try {
      await verifyUserAuthenticationAndAuthorization(input);
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectAccessDeniedException);
      expect((error as Error).message).toBe('このプロジェクトへのアクセス権がありません。');
    }
  });
});
