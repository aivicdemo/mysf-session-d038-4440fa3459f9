import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-381: 検出された差異が許容範囲を超過した場合、discrepancyCategoryが「要対応」と判定される', () => {
  it('should judge discrepancy as exceeding tolerance when amount is above threshold', async () => {
    const input = {
      discrepancyType: '金額差異',
      discrepancyAmount: 150000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.isWithinTolerance).toBe(false);
    expect(result.toleranceCriteria).toBeDefined();
  });

  it('should return appropriate compliance status for amount exceeding tolerance', async () => {
    const input = {
      discrepancyType: '金額差異',
      discrepancyAmount: 150000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.toleranceCriteria?.discrepancyType).toBe('金額差異');
    expect(result.amountComplianceStatus.status).toBe('EXCEEDS_TOLERANCE');
  });
});
