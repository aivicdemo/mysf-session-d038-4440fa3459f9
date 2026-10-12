import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';

describe('SCEN-470: 表示開始日が表示終了日より後の場合のエラー処理', () => {
  it('displayStartDate が displayEndDate より後の場合、「期間指定が不正です。開始日は終了日より前にしてください。」エラーを throw する', async () => {
    const input = {
      customerId: '550e8400-e29b-41d4-a716-446655440000',
      loginUserId: 'user-12345',
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
      displayStartDate: new Date('2026-10-08T00:00:00Z'),
      displayEndDate: new Date('2026-10-07T00:00:00Z'),
    } as any;

    await expect(displayCustomerTransactionHistory(input)).rejects.toThrow(
      '期間指定が不正です。開始日は終了日より前にしてください。'
    );
  });
});
