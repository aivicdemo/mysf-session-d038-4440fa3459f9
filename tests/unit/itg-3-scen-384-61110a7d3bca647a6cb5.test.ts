import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-384: 差異種類が許容基準に存在し、金額・件数・ステータスすべてが許容範囲内のとき、許容範囲内と判定される', () => {
  it('should judge all compliance criteria as within tolerance when all values are within thresholds', async () => {
    const input = {
      discrepancyType: 'AMOUNT',
      discrepancyAmount: 5000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.isWithinTolerance).toBe(true);
    expect(result.toleranceCriteria).toBeDefined();
    expect(result.amountComplianceStatus.status).toBe('WITHIN_TOLERANCE');
    expect(result.countComplianceStatus.status).toBe('NOT_APPLICABLE');
    expect(result.statusComplianceStatus.status).toBe('NOT_APPLICABLE');
  });

  it('should return tolerance criteria matching the discrepancy type', async () => {
    const input = {
      discrepancyType: 'AMOUNT',
      discrepancyAmount: 5000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.toleranceCriteria?.discrepancyType).toBe('AMOUNT');
    expect(result.toleranceCriteria?.toleranceCount).toBeNull();
    expect(result.toleranceCriteria?.toleranceStatusDifference).toBeNull();
  });
});
