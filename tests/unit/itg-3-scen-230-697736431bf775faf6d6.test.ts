import { retrieveDiscrepanciesForCSVExport, DataStoreAccessError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-230: 新システム請求書テーブルへのアクセスに失敗した場合、DataStoreAccessErrorエラーを発生させる', () => {
  const discrepancyIds = ['550e8400-e29b-41d4-a716-446655440000'];
  const discrepancyRecord = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    legacySystemInvoiceId: 'OLD-INV-2025-001',
    newSystemInvoiceId: 'NEW-INV-2025-001',
    discrepancyType: '金額差異',
    discrepancyContent: '請求金額が1000円異なる',
    amountDifference: 1000,
    countDifference: 0,
    statusDifference: null,
    detectionDateTime: '2025-01-15T10:30:00Z',
    severity: '高',
    causeClassification: '計算誤差',
    toleranceJudgment: '超過',
    toleranceJudgmentDateTime: '2025-01-15T11:00:00Z',
    judgedByUserId: '00000000-0000-0000-0000-000000000001',
  };
  const legacyInvoice = {
    id: 'OLD-INV-2025-001',
    invoiceId: 'OLD-INV-2025-001',
    invoiceNumber: '2025-0001',
    invoiceDate: '2025-01-10T00:00:00Z',
    invoiceAmount: 100000,
    taxAmount: 10000,
    status: '確定',
    paymentDueDate: '2025-02-10T00:00:00Z',
    remarks: '商品販売',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新システム請求書テーブルアクセスが DataStoreError で失敗した場合、DataStoreAccessError エラーを返す', async () => {
    const error = new dataStore.DataStoreError('Database connection failed');

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
      .mockResolvedValueOnce([legacyInvoice])
      .mockRejectedValueOnce(error);

    await expect(
      retrieveDiscrepanciesForCSVExport({ discrepancyIds })
    ).rejects.toThrow(DataStoreAccessError);

    try {
      await retrieveDiscrepanciesForCSVExport({ discrepancyIds });
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message).toBe('データベースアクセスエラーが発生しました。');
      }
    }
  });
});
