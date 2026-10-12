import { fetchAnomalyDetectionLogsByPeriod } from '../../src/logic/data-persistence';
import * as DataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-936: フィルター条件をすべて指定しないとき、指定期間内のすべての異常検知ログが検知日時の降順で返される', () => {
  const mockDataStore = DataStore as jest.Mocked<typeof DataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内のすべてのログを検知日時の降順で返す', async () => {
    const anomalyLogs = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440001',
        detectionTimestamp: new Date('2024-01-15T14:30:00Z'),
        anomalyType: '金額ズレ',
        severity: '高',
        anomalyContent: '請求金額と実績金額が不一致',
        expectedValue: '100000',
        actualValue: '95000',
        status: '未対応',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440001',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440002',
        detectionTimestamp: new Date('2024-01-20T09:15:00Z'),
        anomalyType: '未請求',
        severity: '中',
        anomalyContent: '決定済み商談が請求されていない',
        expectedValue: '請求済み',
        actualValue: '未請求',
        status: '対応中',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440002',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440003',
        detectionTimestamp: new Date('2024-01-10T16:45:00Z'),
        anomalyType: 'ステータス不整合',
        severity: '低',
        anomalyContent: '商談ステータスが不整合',
        expectedValue: '受注',
        actualValue: '交渉中',
        status: '対応完了',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440003',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440004',
        detectionTimestamp: new Date('2024-01-05T11:20:00Z'),
        anomalyType: '金額ズレ',
        severity: '高',
        anomalyContent: '税額計算エラー',
        expectedValue: '10000',
        actualValue: '9500',
        status: '未対応',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440004',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(anomalyLogs);

    const result = await fetchAnomalyDetectionLogsByPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      anomalyTypeFilter: null,
      severityFilter: null,
      statusFilter: null,
      sortBy: 'detectionDateTime',
    });

    expect(result.anomalyLogs).toHaveLength(4);
    expect(result.totalCount).toBe(4);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // 検知日時の降順を確認
    expect(result.anomalyLogs[0].detectionTimestamp).toEqual(new Date('2024-01-20T09:15:00Z'));
    expect(result.anomalyLogs[1].detectionTimestamp).toEqual(new Date('2024-01-15T14:30:00Z'));
    expect(result.anomalyLogs[2].detectionTimestamp).toEqual(new Date('2024-01-10T16:45:00Z'));
    expect(result.anomalyLogs[3].detectionTimestamp).toEqual(new Date('2024-01-05T11:20:00Z'));
  });
});
