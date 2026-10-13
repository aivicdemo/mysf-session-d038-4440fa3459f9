import { retrieveDiscrepancyDetailsForConfirmation, DataStoreError } from '../../src/logic/discrepancy-persistence';
import type { RetrieveDiscrepancyDetailsForConfirmationInput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-212: 旧システム請求書テーブルのデータ読み取り操作が失敗した場合、DataStoreErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('旧システム請求書テーブル読み取りエラーの場合、DataStoreErrorを発生させる', async () => {
    const discrepancyRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'LEG-INV-2025-001',
      newSystemInvoiceId: 'NEW-INV-2025-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額の不一致',
      amountDifference: 5000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2025-01-15T10:30:00Z',
      severity: '高',
      causeClassification: 'システム移行時のマッピングエラー',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2025-01-15T10:35:00Z',
      judgedByUserId: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T10:35:00Z',
    };

    const dataStoreError = new DataStoreError('Database connection failed');
    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
      .mockRejectedValueOnce(dataStoreError);

    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    await expect(retrieveDiscrepancyDetailsForConfirmation(input)).rejects.toThrow(DataStoreError);
    await expect(retrieveDiscrepancyDetailsForConfirmation(input)).rejects.toThrow('データベースアクセスエラーが発生しました。');
  });
});
