import { saveAnomalyDetectionLog, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-770: saveAnomalyDetectionLog - データストア障害時', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when data store operation fails', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;
    mockDataStore.listRecords.mockResolvedValue([
      { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Test' } as any,
    ]);
    mockDataStore.createRecord.mockRejectedValue(new DataStoreError('異常検知ログの保存に失敗しました。システム管理者に連絡してください。'));

    const input = {
      anomalyDetectionLogId: null,
      detectionDateTime: '2026-10-07T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求明細',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: '660e8400-e29b-41d4-a716-446655440001',
      anomalyContent: '請求金額が契約金額と一致しません',
      expectedValue: '100000',
      actualValue: '95000',
      status: '未対応',
      currentUserId: '770e8400-e29b-41d4-a716-446655440002',
      operationTimestamp: '2026-10-07T10:35:00Z',
    };

    await expect(saveAnomalyDetectionLog(input)).rejects.toThrow(DataStoreError);
    await expect(saveAnomalyDetectionLog(input)).rejects.toThrow('異常検知ログの保存に失敗しました。システム管理者に連絡してください。');
  });
});
