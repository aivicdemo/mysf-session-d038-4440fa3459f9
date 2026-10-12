import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchAnomalyDetectionLogsByRecord, type FetchAnomalyDetectionLogsByRecordInput, type FetchAnomalyDetectionLogsByRecordOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-911: 異常検知ログ取得 - 指定レコードに関連する異常検知ログが0件のエッジケース', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定レコードに関連する異常検知ログが0件のとき、空のリストと件数0を返す', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockResolvedValue([]);

    const input: FetchAnomalyDetectionLogsByRecordInput = {
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result: FetchAnomalyDetectionLogsByRecordOutput = await fetchAnomalyDetectionLogsByRecord(input);

    // anomalyLogs が空の配列か確認
    expect(result.anomalyLogs).toEqual([]);

    // totalCount が0か確認
    expect(result.totalCount).toBe(0);

    // fetchedAt が ISO 8601形式の現在日時か確認
    expect(result.fetchedAt).toBeDefined();
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);
  });
});
