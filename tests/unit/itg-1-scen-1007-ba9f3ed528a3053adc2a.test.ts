import { enforceAccessControlForDataDisplay, InvalidRequestContext, type EnforceAccessControlInput, type UserAccessContext, type DataAccessRequestContext, type TransactionHistoryReference } from '../../src/logic/access-control-enforcement';

describe('SCEN-1007: 要求コンテキストにデバイス情報が指定されていない場合、要求コンテキスト不正エラーが返される', () => {
  it('should throw InvalidRequestContext when deviceContext is null', async () => {
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
        department: 'dept-01',
        position: '営業担当者',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date(),
      },
      transactionHistory,
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'dashboard',
      operationType: 'view',
      deviceContext: null as any,
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
        department: 'dept-01',
        position: '営業担当者',
        subordinateRepresentativeIds: [],
        hierarchyConfirmedAt: new Date(),
      },
      transactionHistory,
    };

    const requestContext: DataAccessRequestContext = {
      dataType: 'dashboard',
      operationType: 'view',
      deviceContext: null as any,
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
