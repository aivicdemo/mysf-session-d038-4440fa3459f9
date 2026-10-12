import { saveAnomalyDetectionLog, InvalidTargetRecordReference } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-769: saveAnomalyDetectionLog - 対象レコードが存在しないとき', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidTargetRecordReference when target record does not exist', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;
    mockDataStore.listRecords.mockResolvedValue([]);

    const input = {
      anomalyDetectionLogId: null,
      detectionDateTime: '2026-10-07T10:30:00Z',
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: 'sales_opportunities',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: '660e8400-e29b-41d4-a716-446655440001',
      anomalyContent: '請求金額と商談金額の不一致',
      expectedValue: '100000',
      actualValue: '95000',
      status: '未対応',
      currentUserId: '770e8400-e29b-41d4-a716-446655440002',
      operationTimestamp: '2026-10-07T10:35:00Z',
    };

    await expect(saveAnomalyDetectionLog(input)).rejects.toThrow(InvalidTargetRecordReference);
    await expect(saveAnomalyDetectionLog(input)).rejects.toThrow('指定された対象レコードが見つかりません。');
    expect(mockDataStore.createRecord).not.toHaveBeenCalled();
  });
});
