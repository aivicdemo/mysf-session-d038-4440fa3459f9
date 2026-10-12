import { enforceAccessControlForDataDisplay, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext } from '../../src/logic/access-control-enforcement';

describe('SCEN-999: ユーザーの職位情報が未設定の状態で顧客情報アクセスが要求され、警告が記録される', () => {
  it('should return accessGranted false and denialReason when user.role is null', async () => {
    const user: UserAccessContext = {
      userId: 'user-001',
      role: null as any,
      organizationHierarchy: {
        department: 'DEPT-001',
        position: '',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date(),
      },
      transactionHistory: [],
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'customer_info',
      operationType: 'view',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
      },
    };

    const input: EnforceAccessControlInput = {
      user,
      requestContext,
    };

    const result = await enforceAccessControlForDataDisplay(input);

    expect(result.accessGranted).toBe(false);
    expect(result.denialReason).toBe('職位情報が未設定です。システム管理者に連絡してください');
    expect(result.visibleDataScope).toEqual({
      visibleRepresentativeIds: [],
      visibleCustomerIds: [],
      visibleDealIds: [],
      visibleInvoiceIds: [],
      visibleActivityIds: [],
    });
    expect(result.fieldMaskingRules).toEqual([]);
    expect(result.operationPermissions).toEqual([]);
  });
});
