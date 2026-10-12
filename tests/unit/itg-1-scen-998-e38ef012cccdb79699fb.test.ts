import type {
  EnforceAccessControlInput,
  UserAccessContext,
  DataAccessRequestContext,
} from '../../src/logic/access-control-enforcement';
import {
  enforceAccessControlForDataDisplay,
} from '../../src/logic/access-control-enforcement';

describe('SCEN-998: 顧客IDが空の状態で顧客情報アクセスが要求され、顧客特定失敗エラーが返される', () => {
  it('requestContext.customerIdがnullの場合、顧客特定失敗エラーが発生する', async () => {
    const user: UserAccessContext = {
      userId: 'user-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'dept-A',
        position: 'sales_representative',
        supervisorId: 'mgr-001',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date('2026-01-01'),
      },
      transactionHistory: [
        {
          customerId: 'cust-001',
          dealIds: ['deal-001', 'deal-002'],
          invoiceIds: ['inv-001', 'inv-002'],
        },
        {
          customerId: 'cust-002',
          dealIds: [],
          invoiceIds: [],
        },
      ],
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'customerInfo',
      operationType: 'read',
      deviceContext: { deviceType: 'desktop', ipAddress: '192.168.1.1' },
      targetDataIds: [null as unknown as string],
    };

    const input: EnforceAccessControlInput = { user, requestContext };

    await expect(enforceAccessControlForDataDisplay(input)).rejects.toThrow(
      '顧客情報が特定できません。顧客名を確認してください'
    );
  });
});
