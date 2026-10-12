import type {
  EnforceAccessControlInput,
  UserAccessContext,
  DataAccessRequestContext,
} from '../../src/logic/access-control-enforcement';
import {
  enforceAccessControlForDataDisplay,
  UnauthorizedAccessAttempt,
} from '../../src/logic/access-control-enforcement';

describe('SCEN-996: 営業担当者が他の営業担当者の顧客情報にアクセスしようとし、アクセス拒否される', () => {
  it('営業担当者が自身の権限外のデータにアクセスしようとした場合、UnauthorizedAccessAttemptエラーが発生する', async () => {
    const user: UserAccessContext = {
      userId: 'sales-rep-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'dept-sales-A',
        position: 'sales_representative',
        supervisorId: 'manager-001',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date('2026-01-01'),
      },
      transactionHistory: [
        {
          customerId: 'cust-101',
          dealIds: ['deal-101'],
          invoiceIds: ['inv-101'],
        },
      ],
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'customer_info',
      operationType: 'view',
      deviceContext: { deviceType: 'desktop', ipAddress: '192.168.1.1' },
      targetDataIds: ['cust-999'],
    };

    const input: EnforceAccessControlInput = { user, requestContext };

    await expect(enforceAccessControlForDataDisplay(input)).rejects.toThrow(UnauthorizedAccessAttempt);
  });
});
