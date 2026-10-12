import { enforceAccessControlForDataDisplay, UnauthorizedAccessAttempt, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext, type TransactionHistoryReference } from '../../src/logic/access-control-enforcement';

describe('SCEN-1001: 営業担当者がダッシュボード表示を要求し、権限がないためアクセス拒否される', () => {
  it('should throw UnauthorizedAccessAttempt when sales representative requests dashboard', async () => {
    const transactionHistory: TransactionHistoryReference[] = [
      {
        customerId: 'cust-001',
        dealIds: ['deal-001'],
        invoiceIds: ['inv-001'],
      },
    ];

    const user: UserAccessContext = {
      userId: 'sales-staff-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'dept-001',
        position: '営業担当者',
        supervisorId: 'manager-001',
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

    await expect(enforceAccessControlForDataDisplay(input)).rejects.toThrow(UnauthorizedAccessAttempt);
  });

  it('error message should indicate permission denial', async () => {
    const transactionHistory: TransactionHistoryReference[] = [
      {
        customerId: 'cust-001',
        dealIds: ['deal-001'],
        invoiceIds: ['inv-001'],
      },
    ];

    const user: UserAccessContext = {
      userId: 'sales-staff-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'dept-001',
        position: '営業担当者',
        supervisorId: 'manager-001',
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

    try {
      await enforceAccessControlForDataDisplay(input);
      fail('should have thrown');
    } catch (e: any) {
      expect(e).toBeInstanceOf(UnauthorizedAccessAttempt);
      expect(e.message).toBe('このデータへのアクセス権限がありません。');
    }
  });
});
