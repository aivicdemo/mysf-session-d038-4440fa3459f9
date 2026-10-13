import { getToleranceCriteriaByDiscrepancyType } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-372: 金額差異の許容基準を取得すると許容金額が数値で返される', () => {
  test('金額差異の許容基準を取得した場合、許容金額が数値で返される', async () => {
    const input = {
      discrepancyType: '金額差異',
    };

    const result = await getToleranceCriteriaByDiscrepancyType(input);

    expect(result).not.toBeNull();
    expect(result?.discrepancyType).toBe('金額差異');
    expect(result?.toleranceAmount).toBeDefined();
    expect(typeof result?.toleranceAmount).toBe('number');
    expect(result?.toleranceAmount).toBeGreaterThan(0);
  });
});
