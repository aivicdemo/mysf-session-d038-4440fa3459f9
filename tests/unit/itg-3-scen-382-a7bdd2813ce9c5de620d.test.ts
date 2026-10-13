import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-382: 差異が許容範囲内の場合、nextActionが「監視継続」と設定される', () => {
  it('should return isWithinTolerance true when discrepancy is within tolerance', async () => {
    const input = {
      discrepancyType: '金額差異',
      discrepancyAmount: 5000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.isWithinTolerance).toBe(true);
    expect(result.amountComplianceStatus.status).toBe('WITHIN_TOLERANCE');
  });

  it('should set appropriate compliance statuses for within tolerance', async () => {
    const input = {
      discrepancyType: '金額差異',
      discrepancyAmount: 5000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.amountComplianceStatus.detectedValue).toBe(5000);
    expect(result.countComplianceStatus.status).toBe('NOT_APPLICABLE');
    expect(result.statusComplianceStatus.status).toBe('NOT_APPLICABLE');
  });
});
