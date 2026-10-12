import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';

describe('SCEN-469: 顧客IDが空または不正な形式の場合のエラー処理', () => {
  it('空の customerId で呼び出した場合、「顧客IDが指定されていません。正しい顧客を選択してください。」エラーを throw する', async () => {
    const input = {
      customerId: '',
      loginUserId: 'user-001',
      currentDateTime: new Date('2026-10-07T10:00:00Z'),
    };

    await expect(displayCustomerTransactionHistory(input)).rejects.toThrow(
      '顧客IDが指定されていません。正しい顧客を選択してください。'
    );
  });
});
