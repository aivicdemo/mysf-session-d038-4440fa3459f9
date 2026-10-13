import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';
import * as discrepancyToleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-388: 複数の差異項目が同時に超過しているとき、許容範囲超過と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isWithinTolerance=false when multiple discrepancy items exceed tolerance', async () => {
    const mockToleranceCriteria = {
      criteriaId: 'criteria-1',
      discrepancyType: 'AMOUNT',
      toleranceAmount: 100000,
      toleranceCount: 10,
      toleranceStatusDifference: 'MINOR',
    };

    jest
      .spyOn(discrepancyToleranceCriteria, 'getToleranceCriteriaByDiscrepancyType')
      .mockResolvedValue(mockToleranceCriteria);

    const input = {
      discrepancyType: 'AMOUNT',
      discrepancyAmount: 150000,
      discrepancyCount: 25,
      discrepancyStatus: 'MISMATCH',
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.isWithinTolerance).toBe(false);
    expect(result.toleranceCriteria).toEqual(mockToleranceCriteria);
    expect(result.amountComplianceStatus.status).toBe('EXCEEDS_TOLERANCE');
    expect(result.countComplianceStatus.status).toBe('EXCEEDS_TOLERANCE');
    expect(result.statusComplianceStatus.status).toBe('EXCEEDS_TOLERANCE');
  });
});
