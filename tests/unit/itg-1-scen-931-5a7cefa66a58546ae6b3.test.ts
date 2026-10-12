import { fetchAnomalyDetectionLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStoreMod from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-931: ステータスフィルターを指定したとき、該当するステータスのログのみが抽出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter anomaly logs by status and return them in descending order by detection time', async () => {
    const mockAnomalyLogs = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440001',
        detectionTimestamp: '2024-01-15T14:30:00Z',
        anomalyType: '金額ズレ',
        severity: '高',
        anomalyContent: '請求額が期待値と異なる',
        expectedValue: '10000',
        actualValue: '9500',
        status: '未対応',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440001',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440002',
        detectionTimestamp: '2024-01-10T10:15:00Z',
        anomalyType: '未請求',
        severity: '中',
        anomalyContent: '商談成立後、請求書が作成されていない',
        expectedValue: '請求書作成済み',
        actualValue: '請求書未作成',
        status: '対応済み',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440002',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440003',
        detectionTimestamp: '2024-01-20T16:45:00Z',
        anomalyType: 'ステータス不整合',
        severity: '高',
        anomalyContent: '請求明細ステータスが商談ステータスと一致しない',
        expectedValue: 'クローズ',
        actualValue: '処理中',
        status: '未対応',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440003',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440004',
        detectionTimestamp: '2024-01-05T08:20:00Z',
        anomalyType: '金額ズレ',
        severity: '低',
        anomalyContent: '消費税計算誤り',
        expectedValue: '1000',
        actualValue: '1100',
        status: '未対応',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440004',
      },
    ];

    (dataStoreMod.listRecords as jest.Mock).mockResolvedValue(mockAnomalyLogs);

    const result = await fetchAnomalyDetectionLogsByPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      statusFilter: '未対応',
      anomalyTypeFilter: null,
      severityFilter: null,
      sortBy: 'detectionDateTime',
    });

    expect(result.anomalyLogs).toHaveLength(3);
    expect(result.anomalyLogs[0].anomalyDetectionLogId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect(result.anomalyLogs[0].detectionTimestamp).toBe('2024-01-20T16:45:00Z');
    expect(result.anomalyLogs[1].anomalyDetectionLogId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.anomalyLogs[1].detectionTimestamp).toBe('2024-01-15T14:30:00Z');
    expect(result.anomalyLogs[2].anomalyDetectionLogId).toBe('550e8400-e29b-41d4-a716-446655440004');
    expect(result.anomalyLogs[2].detectionTimestamp).toBe('2024-01-05T08:20:00Z');
    expect(result.totalCount).toBe(3);
  });
});
