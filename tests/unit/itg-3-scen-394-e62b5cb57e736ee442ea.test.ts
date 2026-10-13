import { judgeDiscrepancyWithinTolerance, InvalidDiscrepancyInput } from '../../src/logic/discrepancy-tolerance-criteria';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence');

describe('SCEN-394: 金額差異と件数差異がともにnullで、ステータス差異も空文字列のとき、InvalidDiscrepancyInputエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidDiscrepancyInput error when all discrepancy values are null or empty', async () => {
    const toleranceCriteria = {
      criteriaId: 'criteria-001',
      discrepancyType: 'AMOUNT',
      toleranceAmount: 1000,
      toleranceCount: 10,
      toleranceStatusDifference: 'ALLOWED_STATUSES',
    };

    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(toleranceCriteria);

    await expect(
      judgeDiscrepancyWithinTolerance({
        discrepancyType: 'AMOUNT',
        discrepancyAmount: null,
        discrepancyCount: null,
        discrepancyStatus: '',
      })
    ).rejects.toThrow(InvalidDiscrepancyInput);

    const error = new InvalidDiscrepancyInput('差異データの入力値が不正です: discrepancyAmount、discrepancyCount、discrepancyStatus がすべて空（null または空文字列）の場合、検証対象となる差異が存在しません');
    expect(error.message).toBe('差異データの入力値が不正です: discrepancyAmount、discrepancyCount、discrepancyStatus がすべて空（null または空文字列）の場合、検証対象となる差異が存在しません');
  });
});
