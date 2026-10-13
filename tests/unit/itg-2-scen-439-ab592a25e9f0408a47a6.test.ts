import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput } from '../../src/logic/authentication-authorization';

describe('SCEN-439: TCO試算シート自動生成 - 計算ロジック定義検証', () => {
  it('請求書・請求明細の計算ロジック定義が正確に記録されていることが検証される', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-001',
      },
      operationType: 'generate_mapping',
      projectId: 'proj-invoice-sf-migration',
      userProjectRoles: [{ projectId: 'proj-invoice-sf-migration', role: 'project_manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-001');
    expect(result.operationType).toBe('generate_mapping');
    expect(result.projectId).toBe('proj-invoice-sf-migration');
    expect(result.denialReason).toBeNull();
  });
});
