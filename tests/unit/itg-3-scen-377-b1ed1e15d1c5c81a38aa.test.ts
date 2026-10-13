import { judgeDiscrepancyWithinTolerance, InvalidDiscrepancyInput } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-377: 差異の数値が負の値の場合、エラー「差異の数値は0以上である必要があります」がthrowされる', () => {
  it('should throw InvalidDiscrepancyInput error when discrepancyAmount is negative', async () => {
    const input = {
      discrepancyType: '金額差異',
      discrepancyAmount: -1000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    await expect(judgeDiscrepancyWithinTolerance(input)).rejects.toThrow(
      InvalidDiscrepancyInput
    );
  });

  it('should have error message indicating non-negative requirement', async () => {
    const input = {
      discrepancyType: '金額差異',
      discrepancyAmount: -1000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    try {
      await judgeDiscrepancyWithinTolerance(input);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDiscrepancyInput);
      expect((error as Error).message).toContain('0以上');
    }
  });
});
