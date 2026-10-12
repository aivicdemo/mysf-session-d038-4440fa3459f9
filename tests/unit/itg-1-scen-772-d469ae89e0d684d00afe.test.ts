import { saveAnomalyDetectionLog, SaveAnomalyDetectionLogOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-772: saveAnomalyDetectionLog - 対応者ID、対応日時、対応コメントがすべてnullのとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save and return record with null responderId, responseDateTime, and responseComment', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;
    mockDataStore.listRecords.mockResolvedValue([
      { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test' } as any,
    ]);

    const newLogId = 'b1234567-c89c-12d3-e4f5-123456789013';
    mockDataStore.createRecord.mockResolvedValue({
      id: newLogId,
      anomalyDetectionLogId: newLogId,
      detectionDateTime: '2026-10-07T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求明細',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: '660e8400-e29b-41d4-a716-446655440001',
      anomalyContent: '請求金額が商談金額と一致しません',
      expectedValue: '100000',
      actualValue: '99000',
      status: '未対応',
      responderId: null,
      responseDateTime: null,
      responseComment: null,
      createdAt: '2026-10-07T11:00:00Z',
      createdBy: '770e8400-e29b-41d4-a716-446655440002',
      updatedAt: '2026-10-07T11:00:00Z',
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
      anomalyContent: '請求金額が商談金額と一致しません',
      expectedValue: '100000',
      actualValue: '99000',
      status: '未対応',
      responderId: null,
      responseDateTime: null,
      responseComment: null,
      currentUserId: '770e8400-e29b-41d4-a716-446655440002',
      operationTimestamp: '2026-10-07T11:00:00Z',
    };

    const result = await saveAnomalyDetectionLog(input);

    expect(result).toBeDefined();
    expect(result.anomalyDetectionLogId).toBeDefined();
    expect(result.responderId).toBeNull();
    expect(result.responseDateTime).toBeNull();
    expect(result.responseComment).toBeNull();
    expect(result.detectionDateTime).toEqual('2026-10-07T10:30:00Z');
    expect(result.anomalyType).toEqual('金額ズレ');
    expect(result.severity).toEqual('高');
    expect(result.targetTable).toEqual('請求明細');
    expect(result.targetRecordId).toEqual('550e8400-e29b-41d4-a716-446655440000');
    expect(result.validationRuleId).toEqual('660e8400-e29b-41d4-a716-446655440001');
    expect(result.anomalyContent).toEqual('請求金額が商談金額と一致しません');
    expect(result.expectedValue).toEqual('100000');
    expect(result.actualValue).toEqual('99000');
    expect(result.status).toEqual('未対応');
    expect(mockDataStore.createRecord).toHaveBeenCalled();
  });
});
