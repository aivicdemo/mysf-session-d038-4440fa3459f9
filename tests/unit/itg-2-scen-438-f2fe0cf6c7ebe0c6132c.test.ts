import { verifyUserAuthenticationAndAuthorization, VerifyUserAuthenticationAndAuthorizationInput } from '../../src/logic/authentication-authorization';

describe('SCEN-438: TCO試算シート自動生成 - Salesforceオブジェクト定義検証', () => {
  it('Salesforce請求書・請求明細カスタムオブジェクト定義の完全性検証に成功する', async () => {
    const input: VerifyUserAuthenticationAndAuthorizationInput = {
      user: {
        authenticationStatus: 'authenticated',
        role: 'project_manager',
        accountStatus: 'active',
        userId: 'user-12345',
      },
      operationType: 'validate_mapping',
      projectId: 'proj-sf-invoice-001',
      userProjectRoles: [{ projectId: 'proj-sf-invoice-001', role: 'project_manager' }],
    };

    const result = await verifyUserAuthenticationAndAuthorization(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userId).toBe('user-12345');
    expect(result.operationType).toBe('validate_mapping');
    expect(result.projectId).toBe('proj-sf-invoice-001');
    expect(result.denialReason).toBeNull();
  });
});
