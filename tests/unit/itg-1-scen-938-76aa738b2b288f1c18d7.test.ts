import { fetchUnresolvedAnomalyDetectionLogs, DataStoreError } from '../../src/logic/data-persistence';
import type { FetchUnresolvedAnomalyDetectionLogsInput, FetchUnresolvedAnomalyDetectionLogsOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-938: 未対応状態の異常検知ログが複数件存在するとき、検知日時の降順で全件を取得して返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('未対応状態の異常検知ログが複数件存在するとき、検知日時の降順で全件を取得して返す', async () => {
    const mockAnomalyLogs: any[] = [
      {
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440001',
        detectionDateTime: '2026-01-15T14:30:00Z',
        anomalyType: '金額ズレ',
        severity: '高',
        targetTable: '請求明細',
        targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440001',
        anomalyContent: '請求金額が営業商談と不一致',
        expectedValue: '100000',
        actualValue: '95000',
        status: '未対応',
        responderId: null,
        responseDateTime: null,
        responseComment: null,
        createdAt: '2026-01-15T14:30:00Z',
        createdBy: '880e8400-e29b-41d4-a716-446655440001',
        updatedAt: '2026-01-15T14:30:00Z',
        updatedBy: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440002',
        detectionDateTime: '2026-01-15T12:15:00Z',
        anomalyType: '未請求案件',
        severity: '中',
        targetTable: '商談',
        targetRecordId: '660e8400-e29b-41d4-a716-446655440002',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440002',
        anomalyContent: 'クローズ済み商談に請求書が存在しない',
        expectedValue: '1',
        actualValue: '0',
        status: '未対応',
        responderId: null,
        responseDateTime: null,
        responseComment: null,
        createdAt: '2026-01-15T12:15:00Z',
        createdBy: '880e8400-e29b-41d4-a716-446655440001',
        updatedAt: '2026-01-15T12:15:00Z',
        updatedBy: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440003',
        detectionDateTime: '2026-01-15T10:00:00Z',
        anomalyType: 'ステータス不整合',
        severity: '高',
        targetTable: '請求',
        targetRecordId: '660e8400-e29b-41d4-a716-446655440003',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440003',
        anomalyContent: '請求ステータスが請求明細と不一致',
        expectedValue: '確定',
        actualValue: '下書き',
        status: '未対応',
        responderId: null,
        responseDateTime: null,
        responseComment: null,
        createdAt: '2026-01-15T10:00:00Z',
        createdBy: '880e8400-e29b-41d4-a716-446655440001',
        updatedAt: '2026-01-15T10:00:00Z',
        updatedBy: '880e8400-e29b-41d4-a716-446655440001',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockAnomalyLogs);

    const input: FetchUnresolvedAnomalyDetectionLogsInput = {
      sortBy: 'detectionDateTime',
    };

    const result: FetchUnresolvedAnomalyDetectionLogsOutput = await fetchUnresolvedAnomalyDetectionLogs(input);

    expect(result.anomalyLogs).toHaveLength(3);
    expect((result.anomalyLogs[0] as any).anomalyDetectionLogId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect((result.anomalyLogs[0] as any).detectionDateTime).toBe('2026-01-15T14:30:00Z');

    expect((result.anomalyLogs[1] as any).anomalyDetectionLogId).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect((result.anomalyLogs[1] as any).detectionDateTime).toBe('2026-01-15T12:15:00Z');

    expect((result.anomalyLogs[2] as any).anomalyDetectionLogId).toBe('550e8400-e29b-41d4-a716-446655440003');
    expect((result.anomalyLogs[2] as any).detectionDateTime).toBe('2026-01-15T10:00:00Z');

    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
