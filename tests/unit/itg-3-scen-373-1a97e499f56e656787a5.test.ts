import { getToleranceCriteriaByDiscrepancyType } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-373: 件数差異の許容基準を取得すると許容件数が数値で返される', () => {
  test('件数差異の許容基準を取得した場合、許容件数が数値で返される', async () => {
    const input = {
      discrepancyType: '件数差異',
    };

    const result = await getToleranceCriteriaByDiscrepancyType(input);

    expect(result).not.toBeNull();
    expect(result?.discrepancyType).toBe('件数差異');
    expect(result?.toleranceCount).toBeDefined();
    expect(typeof result?.toleranceCount).toBe('number');
    expect(result?.toleranceCount).toBeGreaterThanOrEqual(0);
  });
});
