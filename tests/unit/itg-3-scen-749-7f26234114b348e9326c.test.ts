import { retrieveDiscrepancyDetailsForConfirmation, DataStoreError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-749: データ整合性スコアが0-100の範囲外の場合のエラーハンドリング', () => {
  it('重大度が100を超える場合、エラーが返される', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    const { listRecords } = mockDataStore;

    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    listRecords.mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            差異ID: '550e8400-e29b-41d4-a716-446655440000',
            旧システム請求書ID: 'OLD-INV-2024-001',
            新システム請求書ID: 'NEW-INV-2024-001',
            差異種類: '金額差異',
            差異内容: '請求金額の計算ロジック差異により100円の差異が発生',
            金額差異: -100,
            件数差異: 0,
            ステータス差異: null,
            検出日時: '2024-01-15T10:30:00Z',
            重大度: 150,
            原因分類: 'システムロジック差異',
            許容範囲判定: '不合致',
            判定日時: '2024-01-15T11:00:00Z',
            判定者: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T11:00:00Z',
          },
        ];
      }
      return [];
    });

    // テスト実行: エラーが発生することを期待
    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow();
  });
});
