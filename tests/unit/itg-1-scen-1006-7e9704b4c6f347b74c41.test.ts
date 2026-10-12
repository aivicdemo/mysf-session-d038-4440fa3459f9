import { enforceAccessControlForDataDisplay, InvalidRequestContext, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext, type TransactionHistoryReference } from '../../src/logic/access-control-enforcement';

describe('SCEN-1006: 要求コンテキストにデータ種別が指定されていない場合、要求コンテキスト不正エラーが返される', () => {
  it('should throw InvalidRequestContext when dataType is null', async () => {
    const transactionHistory: TransactionHistoryReference[] = [
      {
        customerId: 'cust-001',
        dealIds: ['deal-001'],
        invoiceIds: ['inv-001'],
      },
    ];

    const user: UserAccessContext = {
      userId: 'user-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'dept-001',
        position: '営業担当者',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date(),
      },
      transactionHistory,
    };

    const requestContext: DataAccessRequestContext = {
      dataType: null as any,
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

    await expect(enforceAccessControlForDataDisplay(input)).rejects.toThrow(InvalidRequestContext);
  });

  it('error should contain denialReason field', async () => {
    const transactionHistory: TransactionHistoryReference[] = [
      {
        customerId: 'cust-001',
        dealIds: ['deal-001'],
        invoiceIds: ['inv-001'],
      },
    ];

    const user: UserAccessContext = {
      userId: 'user-001',
      role: '営業担当者',
      organizationHierarchy: {
        department: 'dept-001',
        position: '営業担当者',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date(),
      },
      transactionHistory,
    };

    const requestContext: DataAccessRequestContext = {
      dataType: null as any,
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
      expect(e).toBeInstanceOf(InvalidRequestContext);
      expect(e.denialReason).toBe('要求コンテキストが不正です。');
    }
  });
});
