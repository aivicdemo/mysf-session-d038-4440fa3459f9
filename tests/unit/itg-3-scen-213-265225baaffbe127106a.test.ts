import { jest } from '@jest/globals';
import { retrieveDiscrepancyDetailsForConfirmation, DataStoreError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-213: 新システム請求書テーブルのデータ読み取り操作が失敗した場合', () => {
  const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

  const discrepancyDetectionRecord = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    差異ID: '550e8400-e29b-41d4-a716-446655440000',
    旧システム請求書ID: 'LEGACY-INV-001',
    新システム請求書ID: 'NEW-INV-001',
    差異種類: '金額差異',
    差異内容: '請求金額が異なる',
    金額差異: 5000,
    件数差異: 0,
    ステータス差異: '',
    検出日時: '2025-01-15T10:30:00Z',
    重大度: '高',
    原因分類: '計算誤差',
    許容範囲判定: '範囲外',
    判定日時: '2025-01-15T11:00:00Z',
    判定者: 'user-001',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      switch (tableName) {
        case '差異検出結果':
          return Promise.resolve([discrepancyDetectionRecord]);
        case '新システム請求書':
          return Promise.reject(new DataStoreError('データベースアクセスエラーが発生しました。'));
        default:
          return Promise.resolve([]);
      }
    });
  });

  it('新システム請求書の読み取り失敗時に DataStoreError を発生させる', async () => {
    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow(DataStoreError);
    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow('データベースアクセスエラーが発生しました。');
  });
});
