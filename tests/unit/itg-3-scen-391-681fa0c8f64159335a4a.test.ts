import { judgeDiscrepancyWithinTolerance, type JudgeDiscrepancyWithinToleranceOutput } from '../../src/logic/discrepancy-tolerance-criteria';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/logic/discrepancy-persistence');

describe('SCEN-391: ステータス差異がnullで金額・件数が許容範囲内のとき、全体は許容範囲内と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should judge that discrepancy is within tolerance when status is null and amount/count are within tolerance', async () => {
    const toleranceCriteria = {
      criteriaId: 'criteria-001',
      discrepancyType: 'AMOUNT',
      toleranceAmount: 10000,
      toleranceCount: 5,
      toleranceStatusDifference: null,
    };

    (discrepancyPersistence.retrieveToleranceCriteriaByType as jest.Mock).mockResolvedValue(toleranceCriteria);

    const result = await judgeDiscrepancyWithinTolerance({
      discrepancyType: 'AMOUNT',
      discrepancyAmount: 5000,
      discrepancyCount: 2,
      discrepancyStatus: null,
    });

    expect(result).toMatchObject({
      isWithinTolerance: true,
      toleranceCriteria: expect.objectContaining({
        discrepancyType: 'AMOUNT',
        toleranceAmount: 10000,
        toleranceCount: 5,
        toleranceStatusDifference: null,
      }),
      amountComplianceStatus: expect.objectContaining({
        status: 'WITHIN_TOLERANCE',
        detectedValue: 5000,
        toleranceThreshold: 10000,
      }),
      countComplianceStatus: expect.objectContaining({
        status: 'WITHIN_TOLERANCE',
        detectedValue: 2,
        toleranceThreshold: 5,
      }),
      statusComplianceStatus: expect.objectContaining({
        status: 'NOT_APPLICABLE',
        detectedValue: null,
        toleranceThreshold: null,
      }),
    });
  });
});
