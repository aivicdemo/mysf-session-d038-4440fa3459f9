import type {
  EnforceAccessControlInput,
  UserAccessContext,
  DataAccessRequestContext,
} from '../../src/logic/access-control-enforcement';
import {
  enforceAccessControlForDataDisplay,
} from '../../src/logic/access-control-enforcement';

describe('SCEN-997: ユーザーIDが空の状態で顧客情報アクセスが要求され、認証失敗エラーが返される', () => {
  it('userIdがnullの場合、認証失敗エラーが発生する', async () => {
    const user: UserAccessContext = {
      userId: null as unknown as string,
      role: '営業担当者',
      organizationHierarchy: {
        department: 'DEPT001',
        position: 'sales_representative',
        supervisorId: 'MGR001',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date('2026-01-01'),
      },
      transactionHistory: [
        {
          customerId: 'CUST001',
          dealIds: ['DEAL001'],
          invoiceIds: ['INV001'],
        },
      ],
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'customer_info',
      operationType: 'view',
      deviceContext: { deviceType: 'desktop', ipAddress: '192.168.1.1' },
    };

    const input: EnforceAccessControlInput = { user, requestContext };

    await expect(enforceAccessControlForDataDisplay(input)).rejects.toThrow(
      'ユーザー認証に失敗しました。再度ログインしてください'
    );
  });
});
