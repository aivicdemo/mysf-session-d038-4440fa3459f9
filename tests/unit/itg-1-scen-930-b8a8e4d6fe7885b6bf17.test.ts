import { fetchAnomalyDetectionLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStoreMod from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-930: 重要度フィルターを指定したとき、該当する重要度のログのみが抽出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter anomaly logs by severity and return only HIGH severity logs', async () => {
    const mockAnomalyLogs = [
      {
        id: 'log-001',
        anomalyDetectionLogId: 'log-001',
        detectionTimestamp: '2026-01-15T10:00:00Z',
        anomalyType: 'amount_mismatch',
        severity: 'HIGH',
        anomalyContent: '請求金額が不一致',
        expectedValue: '100000',
        actualValue: '95000',
        status: 'unresolved',
        validationRuleId: 'rule-001',
      },
      {
        id: 'log-002',
        anomalyDetectionLogId: 'log-002',
        detectionTimestamp: '2026-01-15T11:00:00Z',
        anomalyType: 'missing_invoice',
        severity: 'MEDIUM',
        anomalyContent: '未請求案件を検出',
        expectedValue: 'invoiced',
        actualValue: 'pending',
        status: 'unresolved',
        validationRuleId: 'rule-002',
      },
      {
        id: 'log-003',
        anomalyDetectionLogId: 'log-003',
        detectionTimestamp: '2026-01-15T12:00:00Z',
        anomalyType: 'status_inconsistency',
        severity: 'LOW',
        anomalyContent: 'ステータスが不整合',
        expectedValue: 'sent',
        actualValue: 'draft',
        status: 'resolved',
        validationRuleId: 'rule-003',
      },
      {
        id: 'log-004',
        anomalyDetectionLogId: 'log-004',
        detectionTimestamp: '2026-01-15T13:00:00Z',
        anomalyType: 'amount_mismatch',
        severity: 'CRITICAL',
        anomalyContent: '重大な金額ズレ',
        expectedValue: '500000',
        actualValue: '300000',
        status: 'unresolved',
        validationRuleId: 'rule-001',
      },
    ];

    (dataStoreMod.listRecords as jest.Mock).mockResolvedValue(mockAnomalyLogs);

    const result = await fetchAnomalyDetectionLogsByPeriod({
      periodStartDateTime: '2026-01-15T00:00:00Z',
      periodEndDateTime: '2026-01-15T23:59:59Z',
      severityFilter: 'HIGH',
      anomalyTypeFilter: null,
      statusFilter: null,
      sortBy: 'detectionDateTime',
    });

    expect(result.anomalyLogs).toHaveLength(1);
    expect(result.anomalyLogs[0].anomalyDetectionLogId).toBe('log-001');
    expect(result.anomalyLogs[0].severity).toBe('HIGH');
    expect(result.totalCount).toBe(1);
    expect(result.fetchedAt).toBeDefined();
  });
});
