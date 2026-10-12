import { detectDataflowAnomalies, DetectDataflowAnomaliesInput, NoDataflowRecordsFound } from '../../src/logic/dataflow-anomaly-detection';

describe('SCEN-383: 指定期間内にレコードが存在しない場合、NoDataflowRecordsFound エラーが発生', () => {
  it('should throw NoDataflowRecordsFound when no records exist in period', async () => {
    const input: DetectDataflowAnomaliesInput = {
      targetPeriodStartDate: new Date('2025-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2025-01-31T23:59:59Z'),
      executedByUserId: 'user-detector-001',
    };

    await expect(detectDataflowAnomalies(input)).rejects.toThrow(NoDataflowRecordsFound);
    await expect(detectDataflowAnomalies(input)).rejects.toThrow(
      '指定された期間内に検証対象のデータが見つかりません。'
    );
  });
});
