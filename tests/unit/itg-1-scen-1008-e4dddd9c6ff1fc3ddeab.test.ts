import { enforceAccessControlForDataDisplay, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext, type TransactionHistoryReference } from '../../src/logic/access-control-enforcement';

describe('SCEN-1008: ユーザーの過去取引実績に基づいて表示可能な請求書IDの範囲が判定される', () => {
  it('should limit visible invoice IDs based on transaction history', async () => {
    const transactionHistory: TransactionHistoryReference[] = [
      {
        customerId: 'cust-A',
        dealIds: ['deal-001'],
        invoiceIds: ['inv-001', 'inv-002'],
      },
      {
        customerId: 'cust-B',
        dealIds: ['deal-002'],
        invoiceIds: ['inv-003'],
      },
    ];

    const user: UserAccessContext = {
      userId: 'sales-user-001',
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
    expect(result.visibleDataScope.visibleInvoiceIds).toContain('inv-001');
    expect(result.visibleDataScope.visibleInvoiceIds).toContain('inv-002');
    expect(result.visibleDataScope.visibleInvoiceIds).toContain('inv-003');
    expect(result.operationPermissions.some((op: any) => op.operationType === '表示')).toBe(true);
    expect(result.fieldMaskingRules).toEqual([]);
    expect(result.denialReason).toBeNull();
  });
});
