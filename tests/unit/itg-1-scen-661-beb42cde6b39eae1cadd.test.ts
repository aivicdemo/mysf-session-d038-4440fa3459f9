import { recordAnomalyDetection } from '../../src/logic/anomaly-detection-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-661: 正常系：必須項目をすべて満たした異常検知入力で、新しい検知ログを記録して未対応ステータスで返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record anomaly detection with all required fields and return unresolved status', async () => {
    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          ruleName: '請求金額一致確認',
          targetTable: '請求書',
          targetColumn: 'totalAmount',
          validationType: '金額整合性',
          validationCondition: '営業活動記録との金額差異検出',
          warningLevel: '高',
          enabledFlag: true,
          appliedStartDate: new Date('2026-01-01T00:00:00.000Z'),
          appliedEndDate: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          invoiceNumber: 'INV-2026-0001',
          totalAmount: 145000,
        },
      ]);

    (dataStore.createRecord as jest.Mock).mockResolvedValueOnce({
      id: '123e4567-e89b-12d3-a456-426614174000',
    });

    const input = {
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440001',
      validationRuleId: '660e8400-e29b-41d4-a716-446655440001',
      anomalyContent: '請求書ID 550e8400-e29b-41d4-a716-446655440001 の請求合計金額が営業活動記録と一致していません',
      expectedValue: '150000',
      actualValue: '145000',
      detectionTimestamp: new Date('2026-10-08T10:30:00.000Z'),
      detectorId: 'user-agent-001',
    };

    const result = await recordAnomalyDetection(input);

    expect(result.anomalyDetectionLogId).toBeDefined();
    expect(result.recordedAt).toBeDefined();
    expect(result.status).toBe('未対応');
    expect(dataStore.createRecord).toHaveBeenCalledWith(
      'AnomalyDetectionLog',
      expect.objectContaining({
        anomalyType: '金額ズレ',
        severity: '高',
        targetTable: '請求書',
        targetRecordId: '550e8400-e29b-41d4-a716-446655440001',
        validationRuleId: '660e8400-e29b-41d4-a716-446655440001',
        anomalyContent: '請求書ID 550e8400-e29b-41d4-a716-446655440001 の請求合計金額が営業活動記録と一致していません',
        expectedValue: '150000',
        actualValue: '145000',
        status: '未対応',
        responderId: null,
        responseTimestamp: null,
        responseComment: null,
      })
    );
  });
});
