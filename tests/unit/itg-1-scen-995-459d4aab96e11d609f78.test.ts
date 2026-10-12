import type {
  EnforceAccessControlInput,
  UserAccessContext,
  DataAccessRequestContext,
} from '../../src/logic/access-control-enforcement';
import {
  enforceAccessControlForDataDisplay,
} from '../../src/logic/access-control-enforcement';

describe('SCEN-995: 営業部長が同一部門内の他の営業担当者の顧客情報を要求し、金額情報を除いた情報が表示される', () => {
  it('営業部長が配下スタッフの顧客情報を要求した場合、金額フィールドはマスクされ他の情報は表示される', async () => {
    const user: UserAccessContext = {
      userId: 'user-manager-001',
      role: '営業部長',
      organizationHierarchy: {
        department: 'dept-sales-001',
        position: 'manager',
        supervisorId: undefined,
        subordinateRepresentativeIds: ['user-sales-001', 'user-sales-002', 'user-sales-003'],
        hierarchyConfirmedAt: new Date('2026-01-01'),
      },
      transactionHistory: [
        {
          customerId: 'cust-B',
          dealIds: ['deal-101'],
          invoiceIds: ['inv-101'],
        },
      ],
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'customer_info',
      operationType: 'view',
      deviceContext: { deviceType: 'desktop', ipAddress: '192.168.1.1' },
    };

    const input: EnforceAccessControlInput = { user, requestContext };
    const result = await enforceAccessControlForDataDisplay(input);

    expect(result.accessGranted).toBe(true);
    expect(result.visibleDataScope.visibleRepresentativeIds).toEqual(['user-sales-001', 'user-sales-002', 'user-sales-003']);
    expect(result.fieldMaskingRules).toContainEqual({
      fieldName: 'amount',
      maskingType: 'hidden',
      reason: '金額情報は営業部長権限の表示ルールに従う',
    });
    expect(result.fieldMaskingRules).toContainEqual({
      fieldName: 'customerName',
      maskingType: 'visible',
      reason: '顧客名は全員表示',
    });
    expect(result.operationPermissions).toContainEqual({ operationType: 'read', permitted: true });
    expect(result.operationPermissions).toContainEqual({ operationType: 'export', permitted: false });
    expect(result.denialReason).toBeNull();
  });
});
