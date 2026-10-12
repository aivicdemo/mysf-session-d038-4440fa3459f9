import { fetchAnomalyDetectionLogsByPeriod, InvalidSeverity } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import { listRecords } from '../../src/platform/data-store';

describe('SCEN-926: 重要度フィルターが有効な重要度値に該当しない場合、InvalidSeverityエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('InvalidSeverity エラーが発生し、エラーメッセージが「指定された重要度は無効です。」である', async () => {
    const mockListRecords = listRecords as jest.Mock;
    mockListRecords.mockResolvedValue([
      {
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440001',
        検知日時: '2024-01-15T10:30:00Z',
        異常タイプ: 'AMOUNT_MISMATCH',
        重要度: 'HIGH',
        対象テーブル: 'invoices',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440001',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440001',
        異常内容: '請求金額が期待値と異なります',
        期待値: '100000',
        実際値: '95000',
        ステータス: 'PENDING',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
      },
    ]);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      anomalyTypeFilter: null,
      severityFilter: 'INVALID_SEVERITY_VALUE',
      statusFilter: null,
      sortBy: 'detectionDateTime' as const,
    };

    await expect(dataPersistence.fetchAnomalyDetectionLogsByPeriod(input)).rejects.toThrow(InvalidSeverity);
    await expect(dataPersistence.fetchAnomalyDetectionLogsByPeriod(input)).rejects.toThrow(
      '指定された重要度は無効です。'
    );
  });
});
