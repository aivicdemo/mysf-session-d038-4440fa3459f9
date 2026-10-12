import { recordAnomalyDetection } from '../../src/logic/anomaly-detection-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-667: エラー系：異常検知ログテーブルへの保存操作がシステム障害で失敗した場合、DataStoreError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when saving to the anomaly detection log table fails', async () => {
    const dataStoreError = new dataStore.DataStoreError('保存に失敗しました');

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          ruleName: '請求金額一致確認',
          targetTable: '請求書',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
        },
      ])
      .mockResolvedValueOnce([]);

    (dataStore.createRecord as jest.Mock).mockRejectedValueOnce(dataStoreError);

    const input = {
      anomalyType: '金額ズレ',
      severity: '高',
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: '550e8400-e29b-41d4-a716-446655440001',
      anomalyContent: '請求金額と売上金額が一致しません',
      expectedValue: '150000',
      actualValue: '145000',
      detectionTimestamp: new Date('2026-10-07T10:30:00.000Z'),
      detectorId: 'detector-agent-001',
    };

    await expect(recordAnomalyDetection(input)).rejects.toThrow(dataStore.DataStoreError);
  });
});
