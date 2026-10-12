import { fetchAnomalyDetectionLogsByPeriod, InvalidAnomalyType } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-925: 異常タイプフィルターが異常タイプマスタに存在しない場合、InvalidAnomalyTypeエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InvalidAnomalyType エラーが発生し、エラーメッセージが「指定された異常タイプは存在しません。」である', async () => {
    const mockListRecords = listRecords as jest.Mock;
    mockListRecords.mockResolvedValue([
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440000',
        検知日時: '2024-01-15T10:30:00Z',
        異常タイプ: 'AMOUNT_MISMATCH',
        重要度: 'HIGH',
        対象テーブル: '請求明細',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440000',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440000',
        異常内容: '請求金額の不整合',
        期待値: '100000',
        実際値: '95000',
        ステータス: 'UNRESOLVED',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
      },
    ]);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      anomalyTypeFilter: 'NONEXISTENT_TYPE',
      severityFilter: null,
      statusFilter: null,
      sortBy: 'detectionDateTime' as const,
    };

    await expect(dataPersistence.fetchAnomalyDetectionLogsByPeriod(input)).rejects.toThrow(InvalidAnomalyType);
    await expect(dataPersistence.fetchAnomalyDetectionLogsByPeriod(input)).rejects.toThrow(
      '指定された異常タイプは存在しません。'
    );
  });
});
