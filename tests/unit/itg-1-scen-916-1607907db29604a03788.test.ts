import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockDataStore = {
  listRecords: jest.fn<any>(),
};

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  ...mockDataStore,
}));

import * as dataPersistence from '../../src/logic/data-persistence';
import type { FetchAnomalyDetectionLogsByTypeInput, FetchAnomalyDetectionLogsByTypeOutput } from '../../src/logic/data-persistence';

describe('SCEN-916: fetchAnomalyDetectionLogsByType - multiple logs sorted by detection datetime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return anomaly logs filtered by type and sorted descending by detection datetime', async () => {
    const mockRecords = [
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440001',
        検知日時: '2026-10-07T10:30:00Z',
        異常タイプ: '金額ズレ',
        重要度: '高',
        対象テーブル: '請求明細',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440001',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440001',
        異常内容: '請求額が期待値と不一致',
        期待値: '10000',
        実際値: '9500',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2026-10-07T10:30:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-07T10:30:00Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440002',
        検知日時: '2026-10-07T14:15:00Z',
        異常タイプ: '金額ズレ',
        重要度: '中',
        対象テーブル: '請求明細',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440002',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440001',
        異常内容: '消費税計算値が期待値と不一致',
        期待値: '1000',
        実際値: '1100',
        ステータス: '対応済み',
        対応者ID: '990e8400-e29b-41d4-a716-446655440001',
        対応日時: '2026-10-07T15:00:00Z',
        対応コメント: '再計算して修正済み',
        作成日時: '2026-10-07T14:15:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-07T15:00:00Z',
        更新者ID: '990e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440003',
        検知日時: '2026-10-07T08:45:00Z',
        異常タイプ: '金額ズレ',
        重要度: '高',
        対象テーブル: '請求明細',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440003',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440001',
        異常内容: '単価が期待値と不一致',
        期待値: '5000',
        実際値: '4800',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2026-10-07T08:45:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-07T08:45:00Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440004',
        検知日時: '2026-10-07T12:00:00Z',
        異常タイプ: '未請求',
        重要度: '高',
        対象テーブル: '請求書',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440004',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440002',
        異常内容: '商談完了から30日経過しているが請求書未作成',
        期待値: '請求書存在',
        実際値: '請求書なし',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2026-10-07T12:00:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-07T12:00:00Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
    ];

    mockDataStore.listRecords.mockResolvedValueOnce(mockRecords);

    const input: FetchAnomalyDetectionLogsByTypeInput = {
      anomalyType: '金額ズレ',
    };

    const result: FetchAnomalyDetectionLogsByTypeOutput = await dataPersistence.fetchAnomalyDetectionLogsByType(input);

    // Should have 3 records matching "金額ズレ" type
    expect(result.anomalyLogs).toHaveLength(3);

    // Verify sort order: descending by detection datetime
    // Expected order: 2026-10-07T14:15:00Z, 2026-10-07T10:30:00Z, 2026-10-07T08:45:00Z
    expect(result.anomalyLogs[0]).toMatchObject({
      異常検知ログID: '550e8400-e29b-41d4-a716-446655440002',
      検知日時: '2026-10-07T14:15:00Z',
      異常タイプ: '金額ズレ',
    });

    expect(result.anomalyLogs[1]).toMatchObject({
      異常検知ログID: '550e8400-e29b-41d4-a716-446655440001',
      検知日時: '2026-10-07T10:30:00Z',
      異常タイプ: '金額ズレ',
    });

    expect(result.anomalyLogs[2]).toMatchObject({
      異常検知ログID: '550e8400-e29b-41d4-a716-446655440003',
      検知日時: '2026-10-07T08:45:00Z',
      異常タイプ: '金額ズレ',
    });

    // Verify totalCount
    expect(result.totalCount).toBe(3);

    // Verify fetchedAt is ISO 8601 format
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
