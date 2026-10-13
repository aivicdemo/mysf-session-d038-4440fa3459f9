import { getToleranceCriteriaByDiscrepancyType, DiscrepancyTypeNotFoundError } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-375: 許容基準が定義されていない差異種類を指定した場合、nullが返される', () => {
  it('should return null when discrepancy type is not found in tolerance criteria', async () => {
    const input = {
      discrepancyType: '未定義差異種類'
    };

    const result = await getToleranceCriteriaByDiscrepancyType(input);

    expect(result).toBeNull();
  });

  it('should throw DiscrepancyTypeNotFoundError when discrepancy type is not defined', async () => {
    const input = {
      discrepancyType: '未定義差異種類'
    };

    await expect(getToleranceCriteriaByDiscrepancyType(input)).rejects.toThrow(
      DiscrepancyTypeNotFoundError
    );
  });

  it('should have error message for undefined discrepancy type', async () => {
    const input = {
      discrepancyType: '未定義差異種類'
    };

    try {
      await getToleranceCriteriaByDiscrepancyType(input);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(DiscrepancyTypeNotFoundError);
      expect((error as Error).message).toBe('指定された差異種類に対応する許容基準が見つかりません。');
    }
  });
});
