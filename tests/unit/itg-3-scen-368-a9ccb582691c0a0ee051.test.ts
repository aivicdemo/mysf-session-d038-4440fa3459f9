import { getToleranceCriteriaByDiscrepancyType } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-368: 有効な差異種類を指定して許容基準を取得', () => {
  test('差異種類「金額差異」を指定して許容基準を取得すると、対応する基準値が返される', async () => {
    const input = {
      discrepancyType: '金額差異',
    };

    const result = await getToleranceCriteriaByDiscrepancyType(input);

    expect(result).not.toBeNull();
    expect(result?.discrepancyType).toBe('金額差異');
    expect(result?.criteriaId).toBeDefined();
    expect(typeof result?.toleranceAmount).toBe('number');
    expect(typeof result?.toleranceCount).toBe('number');
    expect(result?.toleranceStatusDifference).toBeDefined();
  });
});
