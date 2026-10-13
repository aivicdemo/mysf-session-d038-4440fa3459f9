import { retrieveDiscrepanciesForCSVExport, DataStoreAccessError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-229: 旧システム請求書テーブルへのアクセスに失敗した場合、DataStoreAccessErrorエラーを発生させる', () => {
  const discrepancyIds = ['550e8400-e29b-41d4-a716-446655440000'];
  const discrepancyRecord = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    legacySystemInvoiceId: 'OLD-INV-001',
    newSystemInvoiceId: 'NEW-INV-001',
    discrepancyType: '金額差異',
    discrepancyContent: '消費税計算の相違',
    amountDifference: 1000,
    countDifference: 0,
    statusDifference: null,
    detectionDateTime: '2025-01-15T10:30:00Z',
    severity: '高',
    causeClassification: '税率変更',
    toleranceJudgment: '範囲外',
    toleranceJudgmentDateTime: '2025-01-15T11:00:00Z',
    judgedByUserId: 'user-uuid-001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('旧システム請求書テーブルアクセスが DataStoreError で失敗した場合、DataStoreAccessError エラーを返す', async () => {
    const error = new dataStore.DataStoreError('Database connection failed');

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
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
