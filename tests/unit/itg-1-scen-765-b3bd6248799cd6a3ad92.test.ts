import { saveAnomalyDetectionLog, InvalidAnomalyDetectionLogInput } from '../../src/logic/data-persistence';
import type { SaveAnomalyDetectionLogInput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-765: saveAnomalyDetectionLog - 異常タイプが空文字列時のバリデーション', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('異常タイプが空文字列のとき、InvalidAnomalyDetectionLogInputエラーが発生する', async () => {
    const input: SaveAnomalyDetectionLogInput = {
      anomalyDetectionLogId: null,
      detectionDateTime: '2026-10-07T10:30:00Z',
      anomalyType: '',
      severity: '高',
      targetTable: '請求明細',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
      validationRuleId: '660e8400-e29b-41d4-a716-446655440000',
      anomalyContent: '請求金額が期待値と不一致',
      expectedValue: '100000',
      actualValue: '95000',
      status: '未対応',
      responderId: null,
      responseDateTime: null,
      responseComment: null,
      currentUserId: '770e8400-e29b-41d4-a716-446655440000',
      operationTimestamp: '2026-10-07T10:35:00Z',
    };

    await expect(saveAnomalyDetectionLog(input)).rejects.toThrow(InvalidAnomalyDetectionLogInput);
    await expect(saveAnomalyDetectionLog(input)).rejects.toThrow(
      '異常検知ログの必須項目が不足しています。'
    );

    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
