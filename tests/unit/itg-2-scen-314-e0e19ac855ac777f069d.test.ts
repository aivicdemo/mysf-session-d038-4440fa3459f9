import {
  verifyUserAuthenticationAndAuthorization,
  VerifyUserAuthenticationAndAuthorizationInput,
  VerifyUserAuthenticationAndAuthorizationOutput,
} from '../../src/logic/authentication-authorization';

describe('SCEN-314: 認証状態が有効でロール権限とプロジェクトアクセス権も満たす場合', () => {
  it('権限判定が承認される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'project-SF-001',
      userProjectRoles: [{ projectId: 'project-SF-001', role: 'project_manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-SF-001');
    expect(result.denialReason).toBeNull();
  });
});
