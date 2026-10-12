import { enforceAccessControlForDataDisplay, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext, type TransactionHistoryReference } from '../../src/logic/access-control-enforcement';

describe('SCEN-1005: デスクトップからの請求書画面表示要求時に金額がマスクされずに表示される', () => {
  it('should not mask fields for desktop access', async () => {
    const transactionHistory: TransactionHistoryReference[] = [
      {
        customerId: 'cust-A001',
        dealIds: ['deal-A001-001'],
        invoiceIds: ['inv-A001-202401-001'],
      },
    ];

    const user: UserAccessContext = {
      userId: 'sales-user-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'dept-sales-01',
        position: '営業担当者',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date(),
      },
      transactionHistory,
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'invoice',
      operationType: 'display',
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
    expect(result.visibleDataScope.visibleInvoiceIds).toContain('inv-A001-202401-001');
    expect(result.fieldMaskingRules).toEqual([]);
    expect(result.operationPermissions.some((op: any) => op.operationType === 'display' && op.permitted === true)).toBe(true);
    expect(result.denialReason).toBeNull();
  });
});
