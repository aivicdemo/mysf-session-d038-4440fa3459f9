import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-464: 認証・認可が正常で、プロセス差分分析実行権限を持つユーザーがAPIを呼び出すと、プロジェクトコンテキストの解決へ進む', () => {
  it('should return authorized=true when admin user with valid project context calls the API', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'admin',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'project-sf-migration-001',
      userProjectRoles: [
        { projectId: 'project-sf-migration-001', role: 'admin' },
      ],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-sf-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
