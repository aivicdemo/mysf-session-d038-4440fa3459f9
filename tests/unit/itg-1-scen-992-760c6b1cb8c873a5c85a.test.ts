import type {
  EnforceAccessControlInput,
  UserAccessContext,
  DataAccessRequestContext,
} from '../../src/logic/access-control-enforcement';
import {
  enforceAccessControlForDataDisplay,
} from '../../src/logic/access-control-enforcement';

describe('SCEN-992: 営業部長が自部門のダッシュボード表示を要求し、配下営業担当者のデータのみ表示される', () => {
  it('営業部長がダッシュボード表示を要求した場合、accessGrantedはtrue、visibleDataScopeは配下営業担当者に限定される', async () => {
    const user: UserAccessContext = {
      userId: 'mgr-001',
      role: '営業部長',
      organizationHierarchy: {
        department: 'dept-sales-01',
        position: 'manager',
        supervisorId: null,
        subordinateRepresentativeIds: ['staff-001', 'staff-002', 'staff-003'],
        hierarchyConfirmedAt: new Date('2026-01-01'),
      },
      transactionHistory: [
        { customerId: 'cust-100', dealIds: ['deal-500', 'deal-501'], invoiceIds: ['inv-1000', 'inv-1001'] },
      ],
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'dashboard',
      operationType: 'view',
      deviceContext: { deviceType: 'desktop', ipAddress: '192.168.1.1' },
    };

    const input: EnforceAccessControlInput = { user, requestContext };
    const result = await enforceAccessControlForDataDisplay(input);

    expect(result.accessGranted).toBe(true);
    expect(result.visibleDataScope.visibleRepresentativeIds).toEqual(['staff-001', 'staff-002', 'staff-003']);
    expect(result.visibleDataScope.visibleCustomerIds).toContain('cust-100');
    expect(result.visibleDataScope.visibleDealIds).toContain('deal-500');
    expect(result.operationPermissions).toContainEqual({ operationType: 'view', permitted: true });
    expect(result.denialReason).toBeNull();
  });
});
