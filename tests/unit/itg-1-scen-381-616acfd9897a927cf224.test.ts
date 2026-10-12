import { detectDataflowAnomalies, DetectDataflowAnomaliesInput, InvalidPeriodRange } from '../../src/logic/dataflow-anomaly-detection';

describe('SCEN-381: 開始日が終了日より後の場合、InvalidPeriodRange エラーが発生', () => {
  it('should throw InvalidPeriodRange when startDate is after endDate', async () => {
    const input: DetectDataflowAnomaliesInput = {
      targetPeriodStartDate: new Date('2024-01-15T10:00:00Z'),
      targetPeriodEndDate: new Date('2024-01-10T10:00:00Z'),
      executedByUserId: 'user-12345',
    };

    await expect(detectDataflowAnomalies(input)).rejects.toThrow(InvalidPeriodRange);
    await expect(detectDataflowAnomalies(input)).rejects.toThrow(
      '検証対象期間が不正です。開始日時は終了日時以前である必要があります。'
    );
  });
});
