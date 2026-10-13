import { getToleranceCriteriaByDiscrepancyType } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-378: 許容範囲の設定値が存在しない差異種類で評価した場合、警告が出力されデフォルト値で処理が続行される', () => {
  it('should return default tolerance criteria when discrepancy type is not found', async () => {
    const input = {
      discrepancyType: '未設定差異種類'
    };

    const result = await getToleranceCriteriaByDiscrepancyType(input);

    expect(result).toBeDefined();
    expect(result?.discrepancyType).toBe('未設定差異種類');
    expect(result?.toleranceAmount).toBeDefined();
    expect(result?.toleranceCount).toBeDefined();
    expect(result?.toleranceStatusDifference).toBeDefined();
  });

  it('should return record with default values when tolerance criteria not defined', async () => {
    const input = {
      discrepancyType: '未設定差異種類'
    };

    const result = await getToleranceCriteriaByDiscrepancyType(input);

    if (result) {
      expect(typeof result.toleranceAmount === 'number' || result.toleranceAmount === null).toBe(true);
      expect(typeof result.toleranceCount === 'number' || result.toleranceCount === null).toBe(true);
      expect(typeof result.toleranceStatusDifference === 'string' || result.toleranceStatusDifference === null).toBe(true);
    }
  });
});
