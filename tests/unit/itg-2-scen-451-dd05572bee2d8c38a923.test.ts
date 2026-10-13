import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';

describe('SCEN-451: Salesforceメタデータ取得APIが失敗した際の処理', () => {
  it('admin ユーザーが generate_mapping 操作で権限を持つことを確認', async () => {
    const input = {
      user: {
        authenticationStatus: 'authenticated' as const,
        role: 'admin',
        accountStatus: 'active' as const,
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-salesforce-001',
      userProjectRoles: [
        { projectId: 'proj-salesforce-001', role: 'admin' },
      ],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-salesforce-001');
    expect(result.denialReason).toBeNull();
  });
});
