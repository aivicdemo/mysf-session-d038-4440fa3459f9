import type {
  EnforceAccessControlInput,
  UserAccessContext,
  DataAccessRequestContext,
} from '../../src/logic/access-control-enforcement';
import {
  enforceAccessControlForDataDisplay,
} from '../../src/logic/access-control-enforcement';

describe('SCEN-993: 営業部長がダッシュボード表示を要求し、配下営業担当者のフィルタリング結果が設計どおり返される', () => {
  it('営業部長が配下スタッフのデータをフィルタリングして表示要求した場合、部門スコープと操作権限が適切に返される', async () => {
    const user: UserAccessContext = {
      userId: 'mgr-001',
      role: '営業部長',
      organizationHierarchy: {
        department: 'dept-sales-01',
        position: 'manager',
        supervisorId: 'mgr-001',
        subordinateRepresentativeIds: ['staff-001', 'staff-002', 'staff-003'],
        hierarchyConfirmedAt: new Date('2026-01-01'),
      },
      transactionHistory: [
        { customerId: 'cust-101', dealIds: ['deal-101', 'deal-102'], invoiceIds: ['inv-101', 'inv-102'] },
      ],
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'dashboard',
      operationType: 'view',
      deviceContext: { deviceType: 'desktop', ipAddress: '192.168.1.1' },
      targetDataIds: ['staff-001', 'staff-002', 'staff-003'],
    };

    const input: EnforceAccessControlInput = { user, requestContext };
    const result = await enforceAccessControlForDataDisplay(input);

    expect(result.accessGranted).toBe(true);
    expect(result.visibleDataScope.visibleRepresentativeIds).toEqual(['staff-001', 'staff-002', 'staff-003']);
    expect(result.fieldMaskingRules).toContainEqual({
      fieldName: 'amount',
      maskingType: 'visible',
      reason: 'Manager can view financial data',
    });
    expect(result.operationPermissions).toContainEqual({ operationType: 'view', permitted: true });
    expect(result.operationPermissions).toContainEqual({ operationType: 'filter_by_department', permitted: true });
    expect(result.denialReason).toBeNull();
  });
});
