import { fetchAnomalyDetectionLogsByPeriod, DataStoreError } from '../../src/logic/data-persistence';
import type {
  FetchAnomalyDetectionLogsByPeriodInput,
  FetchAnomalyDetectionLogsByPeriodOutput,
} from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-937: 指定された期間内に検知された異常検知ログレコード一覧を、検知日時の降順で取得し、出力のfetchedAtに、データ取得実行日時がISO 8601形式で含まれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('出力のfetchedAtに、データ取得実行日時がISO 8601形式で含まれる', async () => {
    const mockAnomalyLogs: any[] = [
      {
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440001',
        detectionDateTime: '2024-01-15T10:30:00Z',
        anomalyType: '金額ズレ',
        severity: 'HIGH',
        targetTable: '請求明細',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440101',
        validationRuleId: '550e8400-e29b-41d4-a716-446655440201',
        anomalyContent: '請求金額が契約金額と一致しません',
        expectedValue: '100000',
        actualValue: '95000',
        status: '未対応',
        responderId: null,
        responseDateTime: null,
        responseComment: null,
        createdAt: '2024-01-15T10:30:00Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440301',
        updatedAt: '2024-01-15T10:30:00Z',
        updatedBy: '550e8400-e29b-41d4-a716-446655440301',
      },
      {
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440002',
        detectionDateTime: '2024-01-20T14:45:30Z',
        anomalyType: '未請求',
        severity: 'MEDIUM',
        targetTable: '商談',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440102',
        validationRuleId: '550e8400-e29b-41d4-a716-446655440202',
        anomalyContent: 'クローズされた商談に対応する請求書がありません',
        expectedValue: '請求書存在',
        actualValue: '請求書なし',
        status: '対応済み',
        responderId: '550e8400-e29b-41d4-a716-446655440302',
        responseDateTime: '2024-01-21T09:00:00Z',
        responseComment: '請求書を新規作成しました',
        createdAt: '2024-01-20T14:45:30Z',
        createdBy: '550e8400-e29b-41d4-a716-446655440303',
        updatedAt: '2024-01-21T09:00:00Z',
        updatedBy: '550e8400-e29b-41d4-a716-446655440302',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockAnomalyLogs);

    const input: FetchAnomalyDetectionLogsByPeriodInput = {
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      anomalyTypeFilter: null,
      severityFilter: null,
      statusFilter: null,
      sortBy: 'detectionDateTime',
    };

    const result: FetchAnomalyDetectionLogsByPeriodOutput = await fetchAnomalyDetectionLogsByPeriod(input);

    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);

    expect(result.anomalyLogs).toHaveLength(2);
    expect((result.anomalyLogs[0] as any).detectionDateTime).toBe('2024-01-20T14:45:30Z');
    expect((result.anomalyLogs[1] as any).detectionDateTime).toBe('2024-01-15T10:30:00Z');

    expect(result.totalCount).toBe(2);
  });
});
