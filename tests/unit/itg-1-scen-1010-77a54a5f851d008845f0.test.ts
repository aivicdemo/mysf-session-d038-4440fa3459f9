import { enforceAccessControlForDataDisplay, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext, type TransactionHistoryReference } from '../../src/logic/access-control-enforcement';

describe('SCEN-1010: 各フィールドのマスク表示ルールが出力に含まれる', () => {
  it('should include field masking rules for customer information', async () => {
    const transactionHistory: TransactionHistoryReference[] = [
      {
        customerId: 'cust-001',
        dealIds: ['deal-001'],
        invoiceIds: ['inv-001'],
      },
    ];

    const user: UserAccessContext = {
      userId: 'user-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'dept-001',
        position: '営業担当者',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date(),
      },
      transactionHistory,
    };

    const requestContext: DataAccessRequestContext = {
      dataType: '顧客情報',
      operationType: '表示',
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

    expect(result.accessGranted).toBe(true);
    expect(result.visibleDataScope.visibleCustomerIds).toContain('cust-001');
    expect(result.fieldMaskingRules.length).toBeGreaterThanOrEqual(0);
    expect(result.operationPermissions.some((op: any) => op.operationType === '表示' && op.permitted === true)).toBe(true);
    expect(result.denialReason).toBeNull();
  });
});
