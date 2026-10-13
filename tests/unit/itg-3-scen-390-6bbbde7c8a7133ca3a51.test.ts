import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-390: 件数差異がnullで金額・ステータスが許容範囲内のとき、件数差異は判定対象外となり全体は許容範囲内と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isWithinTolerance=true when discrepancyCount is null and other items are within tolerance', async () => {
    const mockToleranceCriteria = {
      criteriaId: 'criteria-3',
      discrepancyType: 'AMOUNT',
      toleranceAmount: 10000,
      toleranceCount: 100,
      toleranceStatusDifference: 'MINOR_DIFFERENCE',
    };

    jest
      .spyOn(discrepancyToleranceCriteria, 'getToleranceCriteriaByDiscrepancyType')
      .mockResolvedValue(mockToleranceCriteria);

    const input = {
      discrepancyType: 'AMOUNT',
      discrepancyAmount: 5000,
      discrepancyCount: null,
      discrepancyStatus: null,
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.isWithinTolerance).toBe(true);
    expect(result.toleranceCriteria).toEqual(mockToleranceCriteria);
    expect(result.amountComplianceStatus.status).toBe('WITHIN_TOLERANCE');
    expect(result.countComplianceStatus.status).toBe('NOT_APPLICABLE');
    expect(result.statusComplianceStatus.status).toBe('NOT_APPLICABLE');
  });
});
