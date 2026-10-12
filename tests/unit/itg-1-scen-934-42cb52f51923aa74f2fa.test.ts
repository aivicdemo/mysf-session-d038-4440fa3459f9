import { fetchAnomalyDetectionLogsByPeriod } from '../../src/logic/data-persistence';
import * as DataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-934: sortByでステータスを指定したとき、結果がステータスでソートされる', () => {
  const mockDataStore = DataStore as jest.Mocked<typeof DataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ステータスでソートされた結果を返す', async () => {
    const anomalyLogs = [
      {
        id: 'log-001',
        anomalyDetectionLogId: 'log-001',
        detectionTimestamp: new Date('2026-01-15T10:30:00Z'),
        anomalyType: '金額ズレ',
        severity: 'HIGH',
        anomalyContent: '請求金額が期待値と異なります',
        expectedValue: '10000',
        actualValue: '15000',
        status: '未対応',
        validationRuleId: 'rule-001',
      },
      {
        id: 'log-002',
        anomalyDetectionLogId: 'log-002',
        detectionTimestamp: new Date('2026-01-15T11:00:00Z'),
        anomalyType: '未請求案件',
        severity: 'MEDIUM',
        anomalyContent: '請求書が生成されていません',
        expectedValue: '請求書あり',
        actualValue: '請求書なし',
        status: '対応中',
        validationRuleId: 'rule-002',
      },
      {
        id: 'log-003',
        anomalyDetectionLogId: 'log-003',
        detectionTimestamp: new Date('2026-01-15T09:15:00Z'),
        anomalyType: '金額ズレ',
        severity: 'HIGH',
        anomalyContent: '小計が合計と一致しません',
        expectedValue: '50000',
        actualValue: '45000',
        status: '対応完了',
        validationRuleId: 'rule-003',
      },
      {
        id: 'log-004',
        anomalyDetectionLogId: 'log-004',
        detectionTimestamp: new Date('2026-01-15T14:20:00Z'),
        anomalyType: 'ステータス不整合',
        severity: 'LOW',
        anomalyContent: 'ステータスが不正遷移しています',
        expectedValue: '受注予定',
        actualValue: 'クローズ',
        status: '未対応',
        validationRuleId: 'rule-004',
      },
      {
        id: 'log-005',
        anomalyDetectionLogId: 'log-005',
        detectionTimestamp: new Date('2026-01-15T13:45:00Z'),
        anomalyType: '金額ズレ',
        severity: 'MEDIUM',
        anomalyContent: '消費税計算が誤っています',
        expectedValue: '税抜100000',
        actualValue: '税抜95000',
        status: '対応中',
        validationRuleId: 'rule-005',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(anomalyLogs);

    const result = await fetchAnomalyDetectionLogsByPeriod({
      periodStartDateTime: '2026-01-15T00:00:00Z',
      periodEndDateTime: '2026-01-15T23:59:59Z',
      anomalyTypeFilter: null,
      severityFilter: null,
      statusFilter: null,
      sortBy: 'status',
    });

    expect(result.anomalyLogs).toHaveLength(5);
    expect(result.totalCount).toBe(5);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // ステータス順でのソート確認
    const statuses = result.anomalyLogs.map((log) => log.status);
    // 対応完了、対応中、対応中、未対応、未対応の順序を確認
    expect(statuses[0]).toBe('対応完了');
    expect(statuses[1]).toMatch(/^対応中$/);
    expect(statuses[2]).toMatch(/^対応中$/);
    expect(statuses[3]).toMatch(/^未対応$/);
    expect(statuses[4]).toMatch(/^未対応$/);
  });
});
