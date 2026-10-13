import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-449: TCO試算シート自動生成処理が監査証跡として記録される', () => {
  it('admin ユーザーが generate_mapping 操作の権限を保有し、アカウントが有効であることを確認', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'admin',
        accountStatus: 'active' as const,
        userId: 'user-pm-001',
      },
      operationType: 'generate_mapping',
      projectId: 'project-sf-migration-001',
      userProjectRoles: [
        { projectId: 'project-sf-migration-001', role: 'admin' },
      ],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-pm-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('project-sf-migration-001');
    expect(result.denialReason).toBeNull();
  });
});
