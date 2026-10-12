import { enforceAccessControlForDataDisplay } from '../../src/logic/access-control-enforcement';
import type { EnforceAccessControlInput, UserAccessContext, OrganizationHierarchy, DataAccessRequestContext, TransactionHistoryReference } from '../../src/logic/access-control-enforcement';

describe('SCEN-1011: ユーザーが実行可能な操作権限が出力のoperationPermissionsに含まれる', () => {
  it('営業担当者が自身の取引実績データへアクセス時、操作権限に「表示」が含まれること', async () => {
    // 前提条件: user
    const user: UserAccessContext = {
      userId: 'USR-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'DEPT-A',
        position: '営業担当者',
        supervisorId: 'MGR-001',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date('2026-10-12'),
      } as any,
      transactionHistory: [
        {
          customerId: 'CUST-001',
          dealIds: ['DEAL-001'],
          invoiceIds: ['INV-001'],
        },
        {
          customerId: 'CUST-002',
          dealIds: ['DEAL-002'],
          invoiceIds: ['INV-002'],
        },
      ],
    } as any;

    // 前提条件: requestContext
    const requestContext: DataAccessRequestContext = {
      dataType: 'dashboard',
      operationType: 'view',
      deviceContext: {
        deviceType: 'desktop',
        ipAddress: '192.168.1.1',
      },
    } as any;

    const input: EnforceAccessControlInput = {
      user,
      requestContext,
    } as any;

    // 実行
    const result = await enforceAccessControlForDataDisplay(input);

    // 期待結果: accessGranted が true、operationPermissions に「view」が含まれている
    expect(result.accessGranted).toBe(true);
    expect(result.operationPermissions).toBeDefined();
    expect(result.operationPermissions.length).toBeGreaterThanOrEqual(1);

    const viewPermission = result.operationPermissions.find(
      (perm) => perm.operationType === 'view'
    );
    expect(viewPermission).toBeDefined();
    expect(viewPermission?.permitted).toBe(true);

    // 期待結果: visibleDataScope に自身の取引実績が含まれている
    expect(result.visibleDataScope).toBeDefined();
    expect(result.visibleDataScope.visibleCustomerIds).toContain('CUST-001');
    expect(result.visibleDataScope.visibleCustomerIds).toContain('CUST-002');
    expect(result.visibleDataScope.visibleDealIds).toContain('DEAL-001');
    expect(result.visibleDataScope.visibleDealIds).toContain('DEAL-002');
    expect(result.visibleDataScope.visibleInvoiceIds).toContain('INV-001');
    expect(result.visibleDataScope.visibleInvoiceIds).toContain('INV-002');

    // 期待結果: denialReason は null であること
    expect(result.denialReason).toBeNull();
  });
});
