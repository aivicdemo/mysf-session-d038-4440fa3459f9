import { getToleranceCriteriaByDiscrepancyType, InvalidDiscrepancyTypeError } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-376: 差異種類が指定されていない状態で差異評価を実行すると、エラー「差異の種類が指定されていません」がthrowされる', () => {
  it('should throw InvalidDiscrepancyTypeError when discrepancyType is null', async () => {
    const input = {
      discrepancyType: null as any
    };

    await expect(getToleranceCriteriaByDiscrepancyType(input)).rejects.toThrow(
      InvalidDiscrepancyTypeError
    );
  });

  it('should have correct error message for null discrepancy type', async () => {
    const input = {
      discrepancyType: null as any
    };

    try {
      await getToleranceCriteriaByDiscrepancyType(input);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDiscrepancyTypeError);
      expect((error as Error).message).toBe('差異種類は必須項目です。');
    }
  });

  it('should throw InvalidDiscrepancyTypeError when discrepancyType is empty string', async () => {
    const input = {
      discrepancyType: ''
    };

    await expect(getToleranceCriteriaByDiscrepancyType(input)).rejects.toThrow(
      InvalidDiscrepancyTypeError
    );
  });
});
