import { saveAnomalyDetectionLog, SaveAnomalyDetectionLogOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-771: saveAnomalyDetectionLog - 期待値と実際値がnullのとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save and return record with null expectedValue and actualValue', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;
    mockDataStore.listRecords.mockResolvedValue([
      { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test' } as any,
    ]);

    const newLogId = 'a1234567-b89c-12d3-e4f5-123456789012';
    mockDataStore.createRecord.mockResolvedValue({
      id: newLogId,
      anomalyDetectionLogId: newLogId,
      detectionDateTime: '2026-10-07T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求明細',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: '660e8400-e29b-41d4-a716-446655440001',
      anomalyContent: '請求金額が期待値と一致しません',
      expectedValue: null,
      actualValue: null,
      status: '未対応',
      responderId: null,
      responseDateTime: null,
      responseComment: null,
      createdAt: '2026-10-07T10:35:00Z',
      createdBy: '770e8400-e29b-41d4-a716-446655440002',
      updatedAt: '2026-10-07T10:35:00Z',
      updatedBy: '770e8400-e29b-41d4-a716-446655440002',
    } as any);

    const input = {
      anomalyDetectionLogId: null,
      detectionDateTime: '2026-10-07T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求明細',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: '660e8400-e29b-41d4-a716-446655440001',
      anomalyContent: '請求金額が期待値と一致しません',
      expectedValue: null,
      actualValue: null,
      status: '未対応',
      currentUserId: '770e8400-e29b-41d4-a716-446655440002',
      operationTimestamp: '2026-10-07T10:35:00Z',
    };

    const result = await saveAnomalyDetectionLog(input);

    expect(result).toBeDefined();
    expect(result.anomalyDetectionLogId).toEqual(newLogId);
    expect(result.expectedValue).toBeNull();
    expect(result.actualValue).toBeNull();
    expect(result.detectionDateTime).toEqual('2026-10-07T10:30:00Z');
    expect(result.anomalyType).toEqual('金額ズレ');
    expect(result.severity).toEqual('高');
    expect(result.targetTable).toEqual('請求明細');
    expect(result.targetRecordId).toEqual('550e8400-e29b-41d4-a716-446655440000');
    expect(result.validationRuleId).toEqual('660e8400-e29b-41d4-a716-446655440001');
    expect(result.anomalyContent).toEqual('請求金額が期待値と一致しません');
    expect(result.status).toEqual('未対応');
    expect(result.responderId).toBeNull();
    expect(result.responseDateTime).toBeNull();
    expect(result.responseComment).toBeNull();
    expect(mockDataStore.createRecord).toHaveBeenCalled();
  });
});
