import { detectDataflowAnomalies, DetectDataflowAnomaliesInput, InvalidExecutorId } from '../../src/logic/dataflow-anomaly-detection';

describe('SCEN-382: ユーザーID が空文字列の場合、InvalidExecutorId エラーが発生', () => {
  it('should throw InvalidExecutorId when executedByUserId is empty string', async () => {
    const input: DetectDataflowAnomaliesInput = {
      targetPeriodStartDate: new Date('2026-01-01T00:00:00.000Z'),
      targetPeriodEndDate: new Date('2026-01-31T23:59:59.999Z'),
      executedByUserId: '',
    };

    await expect(detectDataflowAnomalies(input)).rejects.toThrow(InvalidExecutorId);
    await expect(detectDataflowAnomalies(input)).rejects.toThrow(
      '検証実行者のユーザーIDが指定されていません。'
    );
  });
});
