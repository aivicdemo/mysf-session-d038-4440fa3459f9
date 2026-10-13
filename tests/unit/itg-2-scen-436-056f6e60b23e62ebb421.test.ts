import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput } from '../../src/logic/authentication-authorization';

describe('SCEN-436: TCO試算シート自動生成 - 認証・認可検証に成功', () => {
  it('TCO試算シート生成権限を持つユーザーのAPIリクエストが受け入れられる', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-12345',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-67890',
      userProjectRoles: [{ projectId: 'proj-67890', role: 'project_manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-67890');
    expect(result.denialReason).toBeNull();
  });
});
