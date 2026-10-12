import { fetchAnomalyDetectionLogsByPeriod } from '../../src/logic/data-persistence';
import * as dataStoreMod from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-929: 異常タイプフィルターを指定したとき、該当する異常タイプのログのみが抽出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter anomaly logs by anomalyType and return them in descending order by detection time', async () => {
    const mockAnomalyLogs = [
      {
        id: 'uuid-001',
        anomalyDetectionLogId: 'uuid-001',
        detectionTimestamp: '2024-01-15T10:30:00Z',
        anomalyType: '金額ズレ',
        severity: 'HIGH',
        anomalyContent: '請求金額が営業プロセスと不一致',
        expectedValue: '100000',
        actualValue: '95000',
        status: '未対応',
        validationRuleId: 'uuid-rule-001',
      },
      {
        id: 'uuid-002',
        anomalyDetectionLogId: 'uuid-002',
        detectionTimestamp: '2024-01-15T11:00:00Z',
        anomalyType: '未請求',
        severity: 'MEDIUM',
        anomalyContent: '30日以上請求未実施',
        expectedValue: '請求日時が存在すること',
        actualValue: 'NULL',
        status: '対応中',
        validationRuleId: 'uuid-rule-002',
      },
      {
        id: 'uuid-003',
        anomalyDetectionLogId: 'uuid-003',
        detectionTimestamp: '2024-01-15T09:45:00Z',
        anomalyType: '金額ズレ',
        severity: 'HIGH',
        anomalyContent: '消費税計算誤り',
        expectedValue: '8000',
        actualValue: '8500',
        status: '完了',
        validationRuleId: 'uuid-rule-001',
      },
      {
        id: 'uuid-004',
        anomalyDetectionLogId: 'uuid-004',
        detectionTimestamp: '2024-01-15T12:15:00Z',
        anomalyType: 'ステータス不整合',
        severity: 'LOW',
        anomalyContent: '営業ステータスが請求ステータスと矛盾',
        expectedValue: 'confirmed',
        actualValue: 'pending',
        status: '未対応',
        validationRuleId: 'uuid-rule-003',
      },
    ];

    (dataStoreMod.listRecords as jest.Mock).mockResolvedValue(mockAnomalyLogs);

    const result = await fetchAnomalyDetectionLogsByPeriod({
      periodStartDateTime: '2024-01-15T00:00:00Z',
      periodEndDateTime: '2024-01-15T23:59:59Z',
      anomalyTypeFilter: '金額ズレ',
      severityFilter: null,
      statusFilter: null,
      sortBy: 'detectionDateTime',
    });

    expect(result.anomalyLogs).toHaveLength(2);
    expect(result.anomalyLogs[0].anomalyDetectionLogId).toBe('uuid-002');
    expect(result.anomalyLogs[0].detectionTimestamp).toBe('2024-01-15T11:00:00Z');
    expect(result.anomalyLogs[0].anomalyType).toBe('金額ズレ');
    expect(result.anomalyLogs[1].anomalyDetectionLogId).toBe('uuid-003');
    expect(result.anomalyLogs[1].detectionTimestamp).toBe('2024-01-15T09:45:00Z');
    expect(result.anomalyLogs[1].anomalyType).toBe('金額ズレ');
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();
  });
});
