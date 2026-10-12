import { recordAnomalyDetection, InvalidAnomalyTypeError } from '../../src/logic/anomaly-detection-logging';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-662: エラー系：異常タイプが定義済みリストに無い場合、InvalidAnomalyTypeError を発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidAnomalyTypeError when anomalyType is not in the valid list', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'テスト商談',
        createdAt: new Date('2026-10-01T00:00:00.000Z'),
        updatedAt: new Date('2026-10-07T10:00:00.000Z'),
      },
    ]);

    const input = {
      anomalyType: '予期しない異常タイプ',
      severity: '高',
      targetTable: '商談',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: null,
      anomalyContent: 'システムで定義されていない異常が検出された',
      expectedValue: '定義済み異常タイプ',
      actualValue: '予期しない異常タイプ',
      detectionTimestamp: new Date('2026-10-07T10:30:00.000Z'),
      detectorId: 'detector-001',
    };

    await expect(recordAnomalyDetection(input)).rejects.toThrow(InvalidAnomalyTypeError);
    await expect(recordAnomalyDetection(input)).rejects.toThrow(
      "異常タイプ '予期しない異常タイプ' は無効です。有効な異常タイプ: 金額ズレ、ステータス不整合、未請求案件、参照関係異常、SLA超過、データ不整合"
    );
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
