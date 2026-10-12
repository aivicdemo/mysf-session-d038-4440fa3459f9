import { fetchAnomalyDetectionLogsByPeriod, InvalidStatus } from '../../src/logic/data-persistence';
import { listRecords } from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-927: ステータスフィルターが有効なステータス値に該当しない場合、InvalidStatusエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidStatus error when statusFilter is not a valid status value', async () => {
    const mockListRecords = listRecords as jest.MockedFunction<typeof listRecords>;
    mockListRecords.mockResolvedValue([
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        異常検知ログID: '550e8400-e29b-41d4-a716-446655440001',
        検知日時: '2024-01-15T10:30:00Z',
        異常タイプ: '金額ズレ',
        重要度: 'high',
        対象テーブル: 'orders',
        対象レコードID: '660e8400-e29b-41d4-a716-446655440001',
        検証ルールID: '770e8400-e29b-41d4-a716-446655440001',
        異常内容: '請求金額の不一致',
        期待値: '100000',
        実際値: '95000',
        ステータス: 'pending',
        対応者ID: null,
        対応日時: null,
        対応コメント: null,
        作成日時: '2024-01-15T10:30:00Z',
        作成者ID: '880e8400-e29b-41d4-a716-446655440001',
        更新日時: '2024-01-15T10:30:00Z',
        更新者ID: '880e8400-e29b-41d4-a716-446655440001',
      },
    ]);

    const input = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      anomalyTypeFilter: null,
      severityFilter: null,
      statusFilter: 'invalid_status_value',
      sortBy: 'detectionDateTime' as const,
    };

    await expect(fetchAnomalyDetectionLogsByPeriod(input)).rejects.toThrow(InvalidStatus);
    await expect(fetchAnomalyDetectionLogsByPeriod(input)).rejects.toThrow('指定されたステータスは無効です。');
  });
});
