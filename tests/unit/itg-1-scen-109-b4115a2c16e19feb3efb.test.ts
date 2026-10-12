import { validateInvoiceReferenceIntegrity, DataPersistenceError } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-109: 請求書レコード取得時にエラーが発生した場合、例外がスローされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求書レコード取得時に DataStoreError が発生した場合、DataPersistenceError がスローされ、エラーメッセージが「請求書データの取得に失敗しました。システム管理者に連絡してください。」である', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';

    const mockDealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealAmount: 100000,
    };

    const mockDataStoreError = new Error('DataStoreError');
    mockDataStoreError.name = 'DataStoreError';

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealRecord);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockRejectedValue(mockDataStoreError);

    await expect(validateInvoiceReferenceIntegrity({ dealId })).rejects.toThrow(DataPersistenceError);
    await expect(validateInvoiceReferenceIntegrity({ dealId })).rejects.toThrow('請求書データの取得に失敗しました。システム管理者に連絡してください。');
  });
});
