import { enforceAccessControlForDataDisplay, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext, type TransactionHistoryReference } from '../../src/logic/access-control-enforcement';

describe('SCEN-1003: 営業部長が全社データのダッシュボード表示を要求し、部門内データのみに制限されて返される', () => {
  it('should restrict dashboard data to department scope for manager', async () => {
    const transactionHistory: TransactionHistoryReference[] = [
      {
        customerId: 'cust-001',
        dealIds: ['deal-001'],
        invoiceIds: [],
      },
    ];

    const user: UserAccessContext = {
      userId: 'mgr-001',
      role: '営業部長',
      organizationHierarchy: {
        department: 'dept-001',
        position: '営業部長',
        subordinateRepresentativeIds: ['sales-001', 'sales-002', 'sales-003'],
        hierarchyConfirmedAt: new Date(),
      },
      transactionHistory,
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'dashboard',
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
    expect(result.visibleDataScope.visibleRepresentativeIds).toContain('sales-001');
    expect(result.visibleDataScope.visibleRepresentativeIds).toContain('sales-002');
    expect(result.visibleDataScope.visibleRepresentativeIds).toContain('sales-003');
    expect(result.fieldMaskingRules).toEqual([]);
    expect(result.operationPermissions.some((op: any) => op.operationType === '表示' && op.permitted === true)).toBe(true);
    expect(result.operationPermissions.some((op: any) => op.operationType === '編集' && op.permitted === false)).toBe(true);
    expect(result.operationPermissions.some((op: any) => op.operationType === '削除' && op.permitted === false)).toBe(true);
    expect(result.denialReason).toBeNull();
  });
});
