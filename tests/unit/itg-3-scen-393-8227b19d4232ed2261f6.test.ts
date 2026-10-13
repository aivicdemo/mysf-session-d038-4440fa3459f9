import { judgeDiscrepancyWithinTolerance, InvalidDiscrepancyInput } from '../../src/logic/discrepancy-tolerance-criteria';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence');

describe('SCEN-393: 金額差異が負の数または件数差異が負の数のとき、InvalidDiscrepancyInputエラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidDiscrepancyInput error when discrepancyAmount is negative', async () => {
    const toleranceCriteria = {
      criteriaId: 'criteria-001',
      discrepancyType: 'AMOUNT',
      toleranceAmount: 5000,
      toleranceCount: null,
      toleranceStatusDifference: null,
    };

    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(toleranceCriteria);

    await expect(
      judgeDiscrepancyWithinTolerance({
        discrepancyType: 'AMOUNT',
        discrepancyAmount: -1500,
        discrepancyCount: null,
        discrepancyStatus: null,
      })
    ).rejects.toThrow(InvalidDiscrepancyInput);

    const error = new InvalidDiscrepancyInput('差異データの入力値が不正です: discrepancyAmount は 0 以上である必要があります');
    expect(error.message).toBe('差異データの入力値が不正です: discrepancyAmount は 0 以上である必要があります');
  });
});
