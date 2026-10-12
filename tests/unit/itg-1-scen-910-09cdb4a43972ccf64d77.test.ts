import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchAnomalyDetectionLogsByRecord, type FetchAnomalyDetectionLogsByRecordInput, type FetchAnomalyDetectionLogsByRecordOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-910: 異常検知ログ取得 - 複数件が検知日時の降順で取得される', () => {
  const mockAnomalyLogs = [
    {
      anomalyDetectionLogId: '11111111-1111-1111-1111-111111111111',
      detectionDateTime: '2026-10-07T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      anomalyContent: '請求金額が商談金額と一致しません',
      expectedValue: '1000000',
      actualValue: '950000',
      status: '未対応',
      responderId: null,
      responseDateTime: null,
      responseComment: null,
      createdAt: '2026-10-07T10:30:00Z',
      createdBy: 'user-001',
      updatedAt: '2026-10-07T10:30:00Z',
      updatedBy: 'user-001',
      id: '11111111-1111-1111-1111-111111111111',
    },
    {
      anomalyDetectionLogId: '22222222-2222-2222-2222-222222222222',
      detectionDateTime: '2026-10-07T09:15:00Z',
      anomalyType: 'ステータス不整合',
      severity: '中',
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      anomalyContent: '請求書ステータスが商談ステータスと一致しません',
      expectedValue: '発行済み',
      actualValue: '下書き',
      status: '対応済み',
      responderId: 'user-002',
      responseDateTime: '2026-10-07T09:45:00Z',
      responseComment: 'ステータスを手動で修正しました',
      createdAt: '2026-10-07T09:15:00Z',
      createdBy: 'user-001',
      updatedAt: '2026-10-07T09:45:00Z',
      updatedBy: 'user-002',
      id: '22222222-2222-2222-2222-222222222222',
    },
    {
      anomalyDetectionLogId: '33333333-3333-3333-3333-333333333333',
      detectionDateTime: '2026-10-07T08:00:00Z',
      anomalyType: '未請求',
      severity: '高',
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      anomalyContent: '商談に対応する請求書が存在しません',
      expectedValue: '請求書ID: 存在する',
      actualValue: '請求書ID: 存在しない',
      status: '未対応',
      responderId: null,
      responseDateTime: null,
      responseComment: null,
      createdAt: '2026-10-07T08:00:00Z',
      createdBy: 'user-001',
      updatedAt: '2026-10-07T08:00:00Z',
      updatedBy: 'user-001',
      id: '33333333-3333-3333-3333-333333333333',
    },
    {
      anomalyDetectionLogId: '44444444-4444-4444-4444-444444444444',
      detectionDateTime: '2026-10-06T15:20:00Z',
      anomalyType: '金額ズレ',
      severity: '低',
      targetTable: '商談',
      targetRecordId: '660e8400-e29b-41d4-a716-446655440001',
      validationRuleId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      anomalyContent: '商談金額が見積書金額と一致しません',
      expectedValue: '500000',
      actualValue: '495000',
      status: '未対応',
      responderId: null,
      responseDateTime: null,
      responseComment: null,
      createdAt: '2026-10-06T15:20:00Z',
      createdBy: 'user-001',
      updatedAt: '2026-10-06T15:20:00Z',
      updatedBy: 'user-001',
      id: '44444444-4444-4444-4444-444444444444',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定レコードに関連する異常検知ログが複数件存在するとき、検知日時の降順で全件取得できる', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockResolvedValue(mockAnomalyLogs as any);

    const input: FetchAnomalyDetectionLogsByRecordInput = {
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result: FetchAnomalyDetectionLogsByRecordOutput = await fetchAnomalyDetectionLogsByRecord(input);

    // anomalyLogs が3件返されているか確認
    expect(result.anomalyLogs).toHaveLength(3);

    // totalCount が3か確認
    expect(result.totalCount).toBe(3);

    // fetchedAt が存在し、ISO 8601形式か確認
    expect(result.fetchedAt).toBeDefined();
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
    expect(result.fetchedAt).toMatch(iso8601Regex);

    // 検知日時の降順で並んでいるか確認
    // 期待される順序: 2026-10-07T10:30:00Z → 2026-10-07T09:15:00Z → 2026-10-07T08:00:00Z
    expect(result.anomalyLogs[0].anomalyDetectionLogId).toBe('11111111-1111-1111-1111-111111111111');
    expect(result.anomalyLogs[0].anomalyType).toBe('金額ズレ');
    expect(result.anomalyLogs[1].anomalyDetectionLogId).toBe('22222222-2222-2222-2222-222222222222');
    expect(result.anomalyLogs[1].anomalyType).toBe('ステータス不整合');
    expect(result.anomalyLogs[2].anomalyDetectionLogId).toBe('33333333-3333-3333-3333-333333333333');
    expect(result.anomalyLogs[2].anomalyType).toBe('未請求');
  });
});
