import { retrieveDiscrepancyDetailsForConfirmation, DataStoreError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-748: 影響件数がマイナス値の場合のエラーハンドリング', () => {
  it('件数差異がマイナス値の場合、DataStoreError が返される', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    const { listRecords } = mockDataStore;

    const discrepancyId = 'diff-001';

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return [
          {
            id: 'diff-001',
            差異ID: 'diff-001',
            旧システム請求書ID: 'legacy-inv-001',
            新システム請求書ID: 'new-inv-001',
            差異種類: '件数差異',
            差異内容: '請求明細件数が一致しない',
            金額差異: 0,
            件数差異: -5,
            ステータス差異: null,
            検出日時: '2026-01-15T10:30:00Z',
            重大度: '高',
            原因分類: 'データ移行ロジックエラー',
            許容範囲判定: '範囲外',
            判定日時: '2026-01-15T10:35:00Z',
            判定者: 'user-001',
            createdAt: '2026-01-15T10:30:00Z',
            updatedAt: '2026-01-15T10:35:00Z',
          },
        ];
      }
      return [];
    });

    // テスト実行: エラーが発生することを期待
    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow(DataStoreError);
  });
});
