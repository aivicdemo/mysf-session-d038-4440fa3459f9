import { getToleranceCriteriaByDiscrepancyType, DiscrepancyTypeNotFoundError } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-371: 差異種類が差異許容基準マスタに存在しない場合のエラー処理', () => {
  test('差異種類が差異許容基準マスタに存在しない場合、DiscrepancyTypeNotFoundErrorが発生し文言「指定された差異種類に対応する許容基準が見つかりません。」が返される', async () => {
    const input = {
      discrepancyType: '存在しない差異種類',
    };

    await expect(
      getToleranceCriteriaByDiscrepancyType(input)
    ).rejects.toThrow(DiscrepancyTypeNotFoundError);

    try {
      await getToleranceCriteriaByDiscrepancyType(input);
    } catch (error) {
      if (error instanceof DiscrepancyTypeNotFoundError) {
        expect(error.message).toBe('指定された差異種類に対応する許容基準が見つかりません。');
      }
    }
  });
});
