import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-385: 差異種類が許容基準に存在し、金額差異が許容額を超過するとき、許容範囲超過と判定される', () => {
  it('should judge discrepancy as exceeding tolerance when amount exceeds limit', async () => {
    const input = {
      discrepancyType: 'AMOUNT',
      discrepancyAmount: 15000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.isWithinTolerance).toBe(false);
    expect(result.amountComplianceStatus.status).toBe('EXCEEDS_TOLERANCE');
    expect(result.countComplianceStatus.status).toBe('NOT_APPLICABLE');
    expect(result.statusComplianceStatus.status).toBe('NOT_APPLICABLE');
  });

  it('should return tolerance criteria with exceeded amount status', async () => {
    const input = {
      discrepancyType: 'AMOUNT',
      discrepancyAmount: 15000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.toleranceCriteria?.discrepancyType).toBe('AMOUNT');
    expect(result.amountComplianceStatus.detectedValue).toBe(15000);
  });
});
