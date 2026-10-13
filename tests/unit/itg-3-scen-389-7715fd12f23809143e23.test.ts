import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-389: 金額差異がnullで件数・ステータスが許容範囲内のとき、金額差異は判定対象外となり全体は許容範囲内と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isWithinTolerance=true when discrepancyAmount is null and other items are within tolerance', async () => {
    const mockToleranceCriteria = {
      criteriaId: 'criteria-2',
      discrepancyType: 'AMOUNT',
      toleranceAmount: null,
      toleranceCount: 10,
      toleranceStatusDifference: 'MINOR',
    };

    jest
      .spyOn(discrepancyToleranceCriteria, 'getToleranceCriteriaByDiscrepancyType')
      .mockResolvedValue(mockToleranceCriteria);

    const input = {
      discrepancyType: 'AMOUNT',
      discrepancyAmount: null,
      discrepancyCount: 5,
      discrepancyStatus: null,
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.isWithinTolerance).toBe(true);
    expect(result.toleranceCriteria).toEqual(mockToleranceCriteria);
    expect(result.amountComplianceStatus.status).toBe('NOT_APPLICABLE');
    expect(result.countComplianceStatus.status).toBe('WITHIN_TOLERANCE');
    expect(result.statusComplianceStatus.status).toBe('NOT_APPLICABLE');
  });
});
