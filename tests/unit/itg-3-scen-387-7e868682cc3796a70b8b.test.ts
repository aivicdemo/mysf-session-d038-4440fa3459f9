import { judgeDiscrepancyWithinTolerance } from '../../src/logic/discrepancy-tolerance-criteria';
import type { JudgeDiscrepancyWithinToleranceInput, JudgeDiscrepancyWithinToleranceOutput } from '../../src/logic/discrepancy-tolerance-criteria';

describe('SCEN-387: 差異種類が許容基準に存在し、ステータス差異が許容ステータス差異に該当しないとき、許容範囲超過と判定される', () => {
  it('should judge as EXCEEDED when status difference is not in allowed transitions', async () => {
    const input: JudgeDiscrepancyWithinToleranceInput = {
      discrepancyType: 'STATUS',
      discrepancyAmount: null,
      discrepancyCount: null,
      discrepancyStatus: 'PENDING_TO_COMPLETED',
    };

    const result = (await judgeDiscrepancyWithinTolerance(input)) as JudgeDiscrepancyWithinToleranceOutput;

    expect(result.isWithinTolerance).toBe(false);

    expect(result.toleranceCriteria).not.toBeNull();
    expect(result.toleranceCriteria?.discrepancyType).toBe('STATUS');
    expect(result.toleranceCriteria?.toleranceAmount).toBeNull();
    expect(result.toleranceCriteria?.toleranceCount).toBeNull();

    expect(result.amountComplianceStatus.status).toBe('NOT_APPLICABLE');
    expect(result.amountComplianceStatus.detectedValue).toBeNull();
    expect(result.amountComplianceStatus.toleranceThreshold).toBeNull();

    expect(result.countComplianceStatus.status).toBe('NOT_APPLICABLE');
    expect(result.countComplianceStatus.detectedValue).toBeNull();
    expect(result.countComplianceStatus.toleranceThreshold).toBeNull();

    expect(result.statusComplianceStatus.status).toBe('EXCEEDS_TOLERANCE');
    expect(result.statusComplianceStatus.detectedValue).toBe('PENDING_TO_COMPLETED');
    expect(result.statusComplianceStatus.toleranceThreshold).not.toBeNull();
  });
});
