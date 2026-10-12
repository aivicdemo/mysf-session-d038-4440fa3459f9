import { fetchUnresolvedAnomalyDetectionLogs } from '../../src/logic/data-persistence';
import type { FetchUnresolvedAnomalyDetectionLogsInput, FetchUnresolvedAnomalyDetectionLogsOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-939: ソート順序を重要度で指定すると、重要度でソートした異常検知ログを返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ソート順序を重要度で指定すると、重要度でソートした異常検知ログを返す', async () => {
    const mockAnomalyLogs: any[] = [
      {
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440001',
        detectionDateTime: '2026-01-15T10:30:00Z',
        anomalyType: '金額ズレ',
        severity: '高',
        targetTable: '請求明細',
        targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440001',
        anomalyContent: '請求金額が見積金額と一致しない',
        expectedValue: '100000',
        actualValue: '105000',
        status: '未対応',
        responderId: null,
        responseDateTime: null,
        responseComment: null,
        createdAt: '2026-01-15T10:30:00Z',
        createdBy: '880e8400-e29b-41d4-a716-446655440001',
        updatedAt: '2026-01-15T10:30:00Z',
        updatedBy: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440002',
        detectionDateTime: '2026-01-14T14:20:00Z',
        anomalyType: '未請求案件',
        severity: '中',
        targetTable: '商談',
        targetRecordId: '660e8400-e29b-41d4-a716-446655440002',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440002',
        anomalyContent: 'クローズ済み商談に対応する請求書がない',
        expectedValue: '請求書ID存在',
        actualValue: 'null',
        status: '未対応',
        responderId: null,
        responseDateTime: null,
        responseComment: null,
        createdAt: '2026-01-14T14:20:00Z',
        createdBy: '880e8400-e29b-41d4-a716-446655440001',
        updatedAt: '2026-01-14T14:20:00Z',
        updatedBy: '880e8400-e29b-41d4-a716-446655440001',
      },
      {
        anomalyDetectionLogId: '550e8400-e29b-41d4-a716-446655440003',
        detectionDateTime: '2026-01-16T08:15:00Z',
        anomalyType: 'ステータス不整合',
        severity: '緊急',
        targetTable: '請求明細',
        targetRecordId: '660e8400-e29b-41d4-a716-446655440003',
        validationRuleId: '770e8400-e29b-41d4-a716-446655440003',
        anomalyContent: '請求明細ステータスと親請求書ステータスが一致しない',
        expectedValue: '請求済み',
        actualValue: '下書き',
        status: '未対応',
        responderId: null,
        responseDateTime: null,
        responseComment: null,
        createdAt: '2026-01-16T08:15:00Z',
        createdBy: '880e8400-e29b-41d4-a716-446655440001',
        updatedAt: '2026-01-16T08:15:00Z',
        updatedBy: '880e8400-e29b-41d4-a716-446655440001',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockAnomalyLogs);

    const input: FetchUnresolvedAnomalyDetectionLogsInput = {
      sortBy: 'severity',
    };

    const result: FetchUnresolvedAnomalyDetectionLogsOutput = await fetchUnresolvedAnomalyDetectionLogs(input);

    expect(result.anomalyLogs).toHaveLength(3);
    expect((result.anomalyLogs[0] as any).severity).toBe('中');
    expect((result.anomalyLogs[1] as any).severity).toBe('高');
    expect((result.anomalyLogs[2] as any).severity).toBe('緊急');
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
