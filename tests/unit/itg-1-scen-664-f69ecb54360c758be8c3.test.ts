import { recordAnomalyDetection, MissingRequiredFieldError } from '../../src/logic/anomaly-detection-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-664: エラー系：異常内容、期待値、実際値のいずれかが空文字列またはnullの場合、MissingRequiredFieldError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MissingRequiredFieldError when anomalyContent is empty string', async () => {
    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          請求書番号: 'INV-2026-10001',
          金額: 95000,
          createdAt: new Date('2026-10-01T00:00:00.000Z'),
          updatedAt: new Date('2026-10-07T10:00:00.000Z'),
        },
      ]);

    const input = {
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: null,
      anomalyContent: '',
      expectedValue: '100000',
      actualValue: '95000',
      detectionTimestamp: new Date('2026-10-07T10:30:00.000Z'),
      detectorId: 'detector-001',
    };

    await expect(recordAnomalyDetection(input)).rejects.toThrow(MissingRequiredFieldError);
    await expect(recordAnomalyDetection(input)).rejects.toThrow(
      '必須フィールドが不足しています: anomalyContent'
    );
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
