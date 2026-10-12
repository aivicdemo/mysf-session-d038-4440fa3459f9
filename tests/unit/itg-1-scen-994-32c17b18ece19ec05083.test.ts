import type {
  EnforceAccessControlInput,
  UserAccessContext,
  DataAccessRequestContext,
} from '../../src/logic/access-control-enforcement';
import {
  enforceAccessControlForDataDisplay,
} from '../../src/logic/access-control-enforcement';

describe('SCEN-994: 営業担当者が自分の担当顧客の商談履歴と請求履歴を表示要求し、全情報が表示される', () => {
  it('営業担当者が自分の担当顧客のデータを要求した場合、金額情報を含む全情報が非マスク状態で返される', async () => {
    const user: UserAccessContext = {
      userId: 'SA001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'DEPT-001',
        position: 'sales_representative',
        supervisorId: 'MGR001',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date('2026-01-01'),
      },
      transactionHistory: [
        {
          customerId: 'CUST-001',
          dealIds: ['DEAL-001', 'DEAL-002'],
          invoiceIds: ['INV-001', 'INV-002'],
        },
      ],
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'deal_and_invoice_history',
      operationType: 'view',
      deviceContext: { deviceType: 'desktop', ipAddress: '192.168.1.1' },
      targetDataIds: ['CUST-001'],
    };

    const input: EnforceAccessControlInput = { user, requestContext };
    const result = await enforceAccessControlForDataDisplay(input);

    expect(result.accessGranted).toBe(true);
    expect(result.visibleDataScope.visibleCustomerIds).toEqual(['CUST-001']);
    expect(result.visibleDataScope.visibleDealIds).toEqual(['DEAL-001', 'DEAL-002']);
    expect(result.visibleDataScope.visibleInvoiceIds).toEqual(['INV-001', 'INV-002']);
    expect(result.fieldMaskingRules).toEqual([]);
    expect(result.operationPermissions).toContainEqual({ operationType: 'view', permitted: true });
    expect(result.denialReason).toBeNull();
  });
});
