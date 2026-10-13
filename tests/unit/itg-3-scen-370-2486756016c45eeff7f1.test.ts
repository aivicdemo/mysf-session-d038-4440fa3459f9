import { getToleranceCriteriaByDiscrepancyType, InvalidDiscrepancyTypeError } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-370: 差異種類がnullの場合のエラー処理', () => {
  test('差異種類がnullの場合、InvalidDiscrepancyTypeErrorが発生し文言「差異種類は必須項目です。」が返される', async () => {
    const input = {
      discrepancyType: null as unknown as string,
    };

    await expect(
      getToleranceCriteriaByDiscrepancyType(input)
    ).rejects.toThrow(InvalidDiscrepancyTypeError);

    try {
      await getToleranceCriteriaByDiscrepancyType(input);
    } catch (error) {
      if (error instanceof InvalidDiscrepancyTypeError) {
        expect(error.message).toBe('差異種類は必須項目です。');
      }
    }
  });
});
