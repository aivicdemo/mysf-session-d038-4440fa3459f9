import { jest } from '@jest/globals';
import {
  retrieveDiscrepancyDetailsForConfirmation,
  DataStoreError,
} from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import * as dataStore from '../../src/platform/data-store';

describe('SCEN-215: 差異確認履歴テーブルのデータ読み取り操作が失敗した場合、DataStoreErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異確認履歴テーブルの読み取りが失敗した場合、DataStoreErrorを発生させ、差異確認履歴テーブルのデータ読み取り操作は実行されない', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-001',
        新システム請求書ID: 'NEW-INV-001',
        差異種類: '金額差異',
        差異内容: '請求金額が一致しない',
        金額差異: 10000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2025-01-15T10:30:00Z',
        重大度: '高',
        原因分類: '税計算誤り',
        許容範囲判定: '範囲外',
        判定日時: '2025-01-15T11:00:00Z',
        判定者: 'user-uuid-001',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T11:00:00Z',
      },
    ];

    const legacySystemInvoiceData = [
      {
        id: 'legacy-record-id-001',
        請求書ID: 'LEGACY-INV-001',
        ユーザーID: 'USER-001',
        請求書番号: 'LEGACY-2025-0001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 1100000,
        税金額: 100000,
        ステータス: '発行済み',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: '商品A売上',
        作成日時: '2025-01-10T10:00:00Z',
        更新日時: '2025-01-10T10:00:00Z',
        検証ステータス: '未検証',
        検証日時: null,
      },
    ];

    const newSystemInvoiceData = [
      {
        id: 'new-record-id-001',
        請求書ID: 'NEW-INV-001',
        請求書番号: 'NEW-2025-0001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 1090000,
        税金額: 90000,
        ステータス: '発行済み',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: '商品A売上',
      },
    ];

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockImplementation(async (tableName) => {
      if (tableName === '差異検出結果') return discrepancyDetectionData;
      if (tableName === '旧システム請求書') return legacySystemInvoiceData;
      if (tableName === '新システム請求書') return newSystemInvoiceData;
      if (tableName === '是正追跡管理') return [];
      if (tableName === '差異確認履歴') throw new DataStoreError('データベースアクセスエラーが発生しました。');
      return [];
    });

    const error = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId }).catch(
      (e) => e
    );

    expect(error).toBeInstanceOf(DataStoreError);
    expect(error.message).toBe('データベースアクセスエラーが発生しました。');
  });
});
