import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-380: 検出された差異が許容範囲内の場合、discrepancyCategoryが「軽微」と判定される', () => {
  it('should judge discrepancy as within tolerance when amount is below threshold', async () => {
    const input = {
      discrepancyType: '金額差異',
      discrepancyAmount: 5000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.isWithinTolerance).toBe(true);
    expect(result.toleranceCriteria).toBeDefined();
    expect(result.amountComplianceStatus).toBeDefined();
  });

  it('should return appropriate compliance status for amount within tolerance', async () => {
    const input = {
      discrepancyType: '金額差異',
      discrepancyAmount: 5000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.toleranceCriteria?.discrepancyType).toBe('金額差異');
    expect(result.countComplianceStatus.status).toMatch(/WITHIN_TOLERANCE|NOT_APPLICABLE/);
    expect(result.statusComplianceStatus.status).toMatch(/WITHIN_TOLERANCE|NOT_APPLICABLE/);
  });
});
