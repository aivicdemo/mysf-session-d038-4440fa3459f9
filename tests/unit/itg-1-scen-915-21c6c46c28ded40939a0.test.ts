import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockDataStore = {
  listRecords: jest.fn<any>(),
};

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  ...mockDataStore,
}));

import * as dataPersistence from '../../src/logic/data-persistence';
import type { FetchAnomalyDetectionLogsByRecordInput, FetchAnomalyDetectionLogsByRecordOutput } from '../../src/logic/data-persistence';

describe('SCEN-915: fetchAnomalyDetectionLogsByRecord - ISO 8601 timestamp format', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return anomaly logs sorted by detection datetime descending with ISO 8601 fetchedAt', async () => {
    const mockRecords = [
      {
        異常検知ログID: '660e8400-e29b-41d4-a716-446655440001',
        検知日時: '2026-10-07T10:30:00.000Z',
        異常タイプ: '金額ズレ',
        重要度: '高',
        対象テーブル: '請求書',
        対象レコードID: '550e8400-e29b-41d4-a716-446655440000',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440001',
        異常内容: '請求金額が営業活動の見積金額と不一致',
        期待値: '1000000',
        実際値: '950000',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2026-10-07T10:30:00.000Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-07T10:30:00.000Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検知ログID: '660e8400-e29b-41d4-a716-446655440002',
        検知日時: '2026-10-06T14:15:30.000Z',
        異常タイプ: 'ステータス不整合',
        重要度: '中',
        対象テーブル: '請求書',
        対象レコードID: '550e8400-e29b-41d4-a716-446655440000',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440002',
        異常内容: '請求書ステータスが商談ステータスと不一致',
        期待値: '確定',
        実際値: '下書き',
        ステータス: '対応済み',
        対応者ID: '990e8400-e29b-41d4-a716-446655440001',
        対応日時: '2026-10-06T15:00:00.000Z',
        対応コメント: '商談を確定状態に更新',
        作成日時: '2026-10-06T14:15:30.000Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-06T15:00:00.000Z',
        更新者ID: '990e8400-e29b-41d4-a716-446655440001',
      },
      {
        異常検知ログID: '660e8400-e29b-41d4-a716-446655440003',
        検知日時: '2026-10-05T09:45:15.000Z',
        異常タイプ: '未請求',
        重要度: '高',
        対象テーブル: '商談',
        対象レコードID: 'bb0e8400-e29b-41d4-a716-446655440001',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440003',
        異常内容: '商談が完了状態だが請求書が未作成',
        期待値: '請求書作成済み',
        実際値: '請求書未作成',
        ステータス: '未対応',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2026-10-05T09:45:15.000Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2026-10-05T09:45:15.000Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
    ];

    mockDataStore.listRecords.mockResolvedValueOnce(mockRecords);

    const input: FetchAnomalyDetectionLogsByRecordInput = {
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result: FetchAnomalyDetectionLogsByRecordOutput = await dataPersistence.fetchAnomalyDetectionLogsByRecord(input);

    // Verify anomalyLogs contains 2 records for the target table and record ID
    expect(result.anomalyLogs).toHaveLength(2);

    // Verify first record (newest)
    expect(result.anomalyLogs[0]).toMatchObject({
      異常検知ログID: '660e8400-e29b-41d4-a716-446655440001',
      検知日時: '2026-10-07T10:30:00.000Z',
      異常タイプ: '金額ズレ',
      対象テーブル: '請求書',
      対象レコードID: '550e8400-e29b-41d4-a716-446655440000',
    });

    // Verify second record (older)
    expect(result.anomalyLogs[1]).toMatchObject({
      異常検知ログID: '660e8400-e29b-41d4-a716-446655440002',
      検知日時: '2026-10-06T14:15:30.000Z',
      異常タイプ: 'ステータス不整合',
      対象テーブル: '請求書',
      対象レコードID: '550e8400-e29b-41d4-a716-446655440000',
    });

    // Verify totalCount
    expect(result.totalCount).toBe(2);

    // Verify fetchedAt is ISO 8601 format
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
