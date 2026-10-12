import { fetchAnomalyDetectionLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStoreMod from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-932: 複数のフィルターを同時に指定したとき、すべての条件に合致するログが抽出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter anomaly logs by multiple conditions and return matching logs', async () => {
    const mockAnomalyLogs = [
      {
        id: 'log-001',
        anomalyDetectionLogId: 'log-001',
        detectionTimestamp: '2024-01-15T10:30:00Z',
        anomalyType: '金額ズレ',
        severity: 'high',
        anomalyContent: '請求金額が期待値と異なる',
        expectedValue: '10000',
        actualValue: '9500',
        status: 'unresolved',
        validationRuleId: 'rule-001',
      },
      {
        id: 'log-002',
        anomalyDetectionLogId: 'log-002',
        detectionTimestamp: '2024-01-15T09:15:00Z',
        anomalyType: '金額ズレ',
        severity: 'medium',
        anomalyContent: '請求金額が期待値と異なる',
        expectedValue: '5000',
        actualValue: '5100',
        status: 'resolved',
        validationRuleId: 'rule-001',
      },
      {
        id: 'log-003',
        anomalyDetectionLogId: 'log-003',
        detectionTimestamp: '2024-01-15T14:45:00Z',
        anomalyType: '未請求',
        severity: 'high',
        anomalyContent: '請求予定日を過ぎても請求が行われていない',
        expectedValue: '2024-01-10',
        actualValue: '未請求',
        status: 'unresolved',
        validationRuleId: 'rule-002',
      },
      {
        id: 'log-004',
        anomalyDetectionLogId: 'log-004',
        detectionTimestamp: '2024-01-15T08:00:00Z',
        anomalyType: 'ステータス不整合',
        severity: 'low',
        anomalyContent: '商談ステータスと請求ステータスが不整合',
        expectedValue: 'クローズ',
        actualValue: '営業中',
        status: 'unresolved',
        validationRuleId: 'rule-003',
      },
      {
        id: 'log-005',
        anomalyDetectionLogId: 'log-005',
        detectionTimestamp: '2024-01-14T16:20:00Z',
        anomalyType: '金額ズレ',
        severity: 'high',
        anomalyContent: '請求金額が期待値と異なる',
        expectedValue: '50000',
        actualValue: '48000',
        status: 'unresolved',
        validationRuleId: 'rule-001',
      },
    ];

    (dataStoreMod.listRecords as jest.Mock).mockResolvedValue(mockAnomalyLogs);

    const result = await fetchAnomalyDetectionLogsByPeriod({
      periodStartDateTime: '2024-01-15T00:00:00Z',
      periodEndDateTime: '2024-01-15T23:59:59Z',
      anomalyTypeFilter: '金額ズレ',
      severityFilter: 'high',
      statusFilter: 'unresolved',
      sortBy: 'detectionDateTime',
    });

    expect(result.anomalyLogs).toHaveLength(1);
    expect(result.anomalyLogs[0].anomalyDetectionLogId).toBe('log-001');
    expect(result.anomalyLogs[0].anomalyType).toBe('金額ズレ');
    expect(result.anomalyLogs[0].severity).toBe('high');
    expect(result.anomalyLogs[0].status).toBe('unresolved');
    expect(result.totalCount).toBe(1);
    expect(result.fetchedAt).toBeDefined();
  });
});
