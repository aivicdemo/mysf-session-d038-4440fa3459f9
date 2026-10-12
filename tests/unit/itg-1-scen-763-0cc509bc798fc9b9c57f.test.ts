import { saveAnomalyDetectionLog } from '../../src/logic/data-persistence';
import type { SaveAnomalyDetectionLogInput, SaveAnomalyDetectionLogOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-763: saveAnomalyDetectionLog - 新規異常検知ログ作成', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規異常検知ログを作成するとき、入力値を保存して新しいレコードIDを割り当てた結果が返される', async () => {
    const mockOutput: SaveAnomalyDetectionLogOutput = {
      anomalyDetectionLogId: '990e8400-e29b-41d4-a716-446655440444',
      detectionDateTime: '2026-10-07T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求明細',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: '660e8400-e29b-41d4-a716-446655440001',
      anomalyContent: '請求明細の金額が商談金額と一致しません',
      expectedValue: '1000000',
      actualValue: '950000',
      status: '未対応',
      responderId: null,
      responseDateTime: null,
      responseComment: null,
      createdAt: '2026-10-07T10:35:00Z',
      createdBy: 'user-001',
      updatedAt: '2026-10-07T10:35:00Z',
      updatedBy: 'user-001',
    };

    (dataStore.createRecord as jest.Mock).mockResolvedValue(mockOutput);

    const input: SaveAnomalyDetectionLogInput = {
      anomalyDetectionLogId: null,
      detectionDateTime: '2026-10-07T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求明細',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: '660e8400-e29b-41d4-a716-446655440001',
      anomalyContent: '請求明細の金額が商談金額と一致しません',
      expectedValue: '1000000',
      actualValue: '950000',
      status: '未対応',
      responderId: null,
      responseDateTime: null,
      responseComment: null,
      currentUserId: 'user-001',
      operationTimestamp: '2026-10-07T10:35:00Z',
    };

    const result = await saveAnomalyDetectionLog(input);

    expect(result.anomalyDetectionLogId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.detectionDateTime).toBe('2026-10-07T10:30:00Z');
    expect(result.anomalyType).toBe('金額ズレ');
    expect(result.severity).toBe('高');
    expect(result.targetTable).toBe('請求明細');
    expect(result.targetRecordId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.validationRuleId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.anomalyContent).toBe('請求明細の金額が商談金額と一致しません');
    expect(result.expectedValue).toBe('1000000');
    expect(result.actualValue).toBe('950000');
    expect(result.status).toBe('未対応');
    expect(result.responderId).toBeNull();
    expect(result.responseDateTime).toBeNull();
    expect(result.responseComment).toBeNull();
    expect(result.createdAt).toBeDefined();
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedAt).toBeDefined();
    expect(result.updatedBy).toBe('user-001');
  });
});
