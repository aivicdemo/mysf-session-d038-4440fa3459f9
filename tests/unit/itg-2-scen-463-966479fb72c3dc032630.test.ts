import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-463: 認証・認可が正常で、TCO試算実行権限を持つユーザーがAPIを呼び出すと、全成果物の永続化へ進む', () => {
  it('should return authorized=true when user is authenticated with valid project role', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'project_manager',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'project-salesforce-001',
      userProjectRoles: [
        { projectId: 'project-salesforce-001', role: 'project_manager' },
      ],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-salesforce-001');
    expect(result.denialReason).toBeNull();
  });
});
