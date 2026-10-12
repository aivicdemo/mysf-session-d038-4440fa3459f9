import { enforceAccessControlForDataDisplay, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext, type TransactionHistoryReference } from '../../src/logic/access-control-enforcement';

describe('SCEN-1004: モバイルデバイスからの請求書画面表示要求時に金額などの機密情報がマスクされる', () => {
  it('should mask sensitive fields for mobile access', async () => {
    const transactionHistory: TransactionHistoryReference[] = [
      {
        customerId: 'cust-101',
        dealIds: ['deal-001'],
        invoiceIds: ['INV-2024-001'],
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
      dataType: 'invoice',
      operationType: 'view',
      deviceContext: {
        deviceType: 'mobile',
        ipAddress: '192.168.1.1',
      },
    };

    const input: EnforceAccessControlInput = {
      user,
      requestContext,
    };

    const result = await enforceAccessControlForDataDisplay(input);

    expect(result.accessGranted).toBe(true);
    expect(result.visibleDataScope.visibleInvoiceIds).toContain('INV-2024-001');
    expect(result.fieldMaskingRules.length).toBeGreaterThan(0);
    expect(result.fieldMaskingRules.some((rule: any) => rule.fieldName === '金額')).toBe(true);
    expect(result.operationPermissions.some((op: any) => op.operationType === 'view' && op.permitted === true)).toBe(true);
    expect(result.operationPermissions.some((op: any) => op.operationType === 'edit' && op.permitted === false)).toBe(true);
    expect(result.operationPermissions.some((op: any) => op.operationType === 'delete' && op.permitted === false)).toBe(true);
    expect(result.denialReason).toBeNull();
  });
});
