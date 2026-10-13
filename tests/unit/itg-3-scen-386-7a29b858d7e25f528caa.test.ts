import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';
import type { JudgeDiscrepancyWithinToleranceInput, JudgeDiscrepancyWithinToleranceOutput, ComplianceStatus } from '../../src/logic/discrepancy-tolerance-criteria';
import type { ToleranceCriteriaRecord } from '../../src/logic/discrepancy-persistence';

describe('SCEN-386: 差異種類が許容基準に存在し、件数差異が許容件数を超過するとき、許容範囲超過と判定される', () => {
  it('should judge as EXCEEDED when count difference exceeds tolerance', async () => {
    const input: JudgeDiscrepancyWithinToleranceInput = {
      discrepancyType: 'COUNT',
      discrepancyAmount: null,
      discrepancyCount: 150,
      discrepancyStatus: null,
    };

    const result = (await judgeDiscrepancyWithinTolerance(input)) as JudgeDiscrepancyWithinToleranceOutput;

    expect(result.isWithinTolerance).toBe(false);

    expect(result.toleranceCriteria).not.toBeNull();
    expect(result.toleranceCriteria?.discrepancyType).toBe('COUNT');
    expect(result.toleranceCriteria?.toleranceCount).toBe(100);
    expect(result.toleranceCriteria?.toleranceAmount).toBeNull();
    expect(result.toleranceCriteria?.toleranceStatusDifference).toBeNull();

    expect(result.amountComplianceStatus.status).toBe('NOT_APPLICABLE');
    expect(result.amountComplianceStatus.detectedValue).toBeNull();
    expect(result.amountComplianceStatus.toleranceThreshold).toBeNull();

    expect(result.countComplianceStatus.status).toBe('EXCEEDS_TOLERANCE');
    expect(result.countComplianceStatus.detectedValue).toBe(150);
    expect(result.countComplianceStatus.toleranceThreshold).toBe(100);

    expect(result.statusComplianceStatus.status).toBe('NOT_APPLICABLE');
    expect(result.statusComplianceStatus.detectedValue).toBeNull();
    expect(result.statusComplianceStatus.toleranceThreshold).toBeNull();
  });
});
