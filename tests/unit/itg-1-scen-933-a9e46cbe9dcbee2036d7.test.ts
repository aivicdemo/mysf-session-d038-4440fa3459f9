import { fetchAnomalyDetectionLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStoreMod from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-933: sortByで重要度を指定したとき、結果が重要度でソートされる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort anomaly logs by severity when sortBy is set to severity', async () => {
    const mockAnomalyLogs = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440001',
        detectionTimestamp: '2026-01-15T10:30:00Z',
        anomalyType: '金額ズレ',
        severity: 'high',
        anomalyContent: '請求額が期待値と異なる',
        expectedValue: '100000',
        actualValue: '95000',
        status: '未対応',
        validationRuleId: '750e8400-e29b-41d4-a716-446655440001',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440002',
        detectionTimestamp: '2026-01-14T14:20:00Z',
        anomalyType: '未請求',
        severity: 'medium',
        anomalyContent: '商談が成立しているが請求書が生成されていない',
        expectedValue: '請求書存在',
        actualValue: '請求書なし',
        status: '対応中',
        validationRuleId: '750e8400-e29b-41d4-a716-446655440002',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440003',
        detectionTimestamp: '2026-01-13T09:15:00Z',
        anomalyType: 'ステータス不整合',
        severity: 'low',
        anomalyContent: '請求ステータスが矛盾している',
        expectedValue: 'ステータス: 請求済み',
        actualValue: 'ステータス: 未請求',
        status: '未対応',
        validationRuleId: '750e8400-e29b-41d4-a716-446655440003',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440004',
        detectionTimestamp: '2026-01-12T16:45:00Z',
        anomalyType: '金額ズレ',
        severity: 'high',
        anomalyContent: '税額計算が誤っている',
        expectedValue: '10000',
        actualValue: '12000',
        status: '対応完了',
        validationRuleId: '750e8400-e29b-41d4-a716-446655440004',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440005',
        detectionTimestamp: '2026-01-11T11:00:00Z',
        anomalyType: '未請求',
        severity: 'low',
        anomalyContent: '小額案件の請求遅延',
        expectedValue: '請求書存在',
        actualValue: '請求書なし',
        status: '未対応',
        validationRuleId: '750e8400-e29b-41d4-a716-446655440005',
      },
    ];

    (dataStoreMod.listRecords as jest.Mock).mockResolvedValue(mockAnomalyLogs);

    const result = await fetchAnomalyDetectionLogsByPeriod({
      periodStartDateTime: '2026-01-10T00:00:00Z',
      periodEndDateTime: '2026-01-16T23:59:59Z',
      anomalyTypeFilter: null,
      severityFilter: null,
      statusFilter: null,
      sortBy: 'severity',
    });

    expect(result.anomalyLogs).toHaveLength(5);
    expect(result.totalCount).toBe(5);

    const severityOrder = result.anomalyLogs.map(log => log.severity);
    expect(severityOrder[0]).toBe('high');
    expect(severityOrder[1]).toBe('high');
    expect(severityOrder[2]).toBe('medium');
    expect(severityOrder[3]).toBe('low');
    expect(severityOrder[4]).toBe('low');
  });
});
