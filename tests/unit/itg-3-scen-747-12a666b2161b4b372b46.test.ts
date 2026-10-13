import { retrieveDiscrepancyDetailsForConfirmation, DataStoreError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-747: 差異の種類が空または不明な場合のエラーハンドリング', () => {
  it('差異種類が null の場合、DataStoreError が返される', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    const { listRecords } = mockDataStore;

    const discrepancyId = 'diff-001';

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return [
          {
            差異ID: 'diff-001',
            旧システム請求書ID: 'legacy-inv-001',
            新システム請求書ID: 'new-inv-001',
            差異種類: null,
            差異内容: 'Amount mismatch',
            金額差異: 1000,
            件数差異: 0,
            ステータス差異: null,
            検出日時: '2026-01-15T10:30:00Z',
            重大度: 'high',
            原因分類: 'system_error',
            許容範囲判定: 'out_of_range',
            判定日時: '2026-01-15T11:00:00Z',
            判定者: 'user-001',
          },
        ];
      }
      return [];
    });

    // テスト実行: エラーが発生することを期待
    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow(DataStoreError);
  });
});
