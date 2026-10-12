import { enforceAccessControlForDataDisplay, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext, type TransactionHistoryReference } from '../../src/logic/access-control-enforcement';

describe('SCEN-1009: 表示可能なデータ範囲に営業担当者ID、取引先ID、商談IDが含まれる', () => {
  it('should include representative IDs, customer IDs, and deal IDs in visible data scope', async () => {
    const transactionHistory: TransactionHistoryReference[] = [
      {
        customerId: 'CUST-001',
        dealIds: ['DEAL-001', 'DEAL-002', 'DEAL-003'],
        invoiceIds: ['INV-001', 'INV-002'],
      },
      {
        customerId: 'CUST-002',
        dealIds: [],
        invoiceIds: [],
      },
    ];

    const user: UserAccessContext = {
      userId: 'USER-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'DEPT-001',
        position: '営業担当者',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date(),
      },
      transactionHistory,
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'dashboard',
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
    expect(result.visibleDataScope.visibleRepresentativeIds).toContain('USER-001');
    expect(result.visibleDataScope.visibleCustomerIds).toContain('CUST-001');
    expect(result.visibleDataScope.visibleCustomerIds).toContain('CUST-002');
    expect(result.visibleDataScope.visibleDealIds).toContain('DEAL-001');
    expect(result.visibleDataScope.visibleDealIds).toContain('DEAL-002');
    expect(result.visibleDataScope.visibleDealIds).toContain('DEAL-003');
    expect(result.fieldMaskingRules.length).toBeGreaterThanOrEqual(0);
    expect(result.operationPermissions.some((op: any) => op.operationType === 'display' && op.permitted === true)).toBe(true);
    expect(result.denialReason).toBeNull();
  });
});
