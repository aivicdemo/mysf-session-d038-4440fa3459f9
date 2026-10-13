import { getToleranceCriteriaByDiscrepancyType } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-374: ステータス差異の許容基準を取得すると許容ステータス差異が返される', () => {
  test('ステータス差異の許容基準を取得した場合、許容ステータス差異が返される', async () => {
    const input = {
      discrepancyType: 'ステータス差異',
    };

    const result = await getToleranceCriteriaByDiscrepancyType(input);

    expect(result).not.toBeNull();
    expect(result?.discrepancyType).toBe('ステータス差異');
    expect(result?.toleranceStatusDifference).toBeDefined();
  });
});
