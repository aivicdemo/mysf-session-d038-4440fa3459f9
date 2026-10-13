import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-383: 差異が許容範囲を超過した場合、nextActionが「差異原因の特定へ進む」と設定される', () => {
  it('should return isWithinTolerance false when discrepancy exceeds tolerance', async () => {
    const input = {
      discrepancyType: '金額差異',
      discrepancyAmount: 15000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.isWithinTolerance).toBe(false);
    expect(result.amountComplianceStatus.status).toBe('EXCEEDS_TOLERANCE');
  });

  it('should provide tolerance criteria details when exceeding tolerance', async () => {
    const input = {
      discrepancyType: '金額差異',
      discrepancyAmount: 15000,
      discrepancyCount: null,
      discrepancyStatus: null
    };

    const result = await judgeDiscrepancyWithinTolerance(input);

    expect(result.toleranceCriteria).toBeDefined();
    expect(result.toleranceCriteria?.discrepancyType).toBe('金額差異');
  });
});
