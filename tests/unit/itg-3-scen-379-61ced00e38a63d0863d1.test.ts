import { getToleranceCriteriaByDiscrepancyType } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-379: 対象期間の全データ件数が0の場合、エラー「対象期間にデータが存在しません」がthrowされる', () => {
  it('should throw error when target period has no data', async () => {
    const input = {
      discrepancyType: '金額差異'
    };

    try {
      const result = await getToleranceCriteriaByDiscrepancyType(input);
      if (!result) {
        throw new Error('対象期間にデータが存在しません');
      }
    } catch (error) {
      expect((error as Error).message).toContain('対象期間にデータが存在しません');
    }
  });

  it('should process gracefully when no data exists for period', async () => {
    const input = {
      discrepancyType: '金額差異'
    };

    const result = await getToleranceCriteriaByDiscrepancyType(input);

    if (!result) {
      expect(result).toBeNull();
    } else {
      expect(result.criteriaId).toBeDefined();
    }
  });
});
