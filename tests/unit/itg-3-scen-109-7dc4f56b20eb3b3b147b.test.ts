import { validateCorrectionContentAndJudgeApproval } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-109: 修正により元の差異が解消されず、discrepancyResolvedがfalseになる', () => {
  it('修正結果が却下され、discrepancyResolvedがfalseで返される', async () => {
    const input = {
      discrepancyId: 'DISC-20250107-001',
      correctionBeforeData: {
        dealId: 'DEAL-2024-00123',
        field1: 'value1',
        field2: 1000000,
        field3: 'status1',
        field4: 950000,
        field5: 'status2',
      },
      correctionAfterData: {
        dealId: 'DEAL-2024-00123',
        field1: 'value1',
        field2: 1000000,
        field3: 'status1',
        field4: 980000,
        field5: 'status2',
      },
      approvalCriteria: {
        criterion1: 5000,
        criterion2: ['dealId', 'field1', 'field2', 'field3'],
        criterion3: {
          status1: ['status2', 'status3'],
        },
      },
      correctionExecutorUserId: 'USER-2025-00042',
      correctionExecutedAt: new Date('2025-01-07T09:30:00Z'),
      currentDateTime: new Date('2025-01-07T10:15:00Z'),
    };

    const result = await validateCorrectionContentAndJudgeApproval(input);

    expect(result.validationResult).toBe('rejected');
    expect(result.approvalCriteriaMet).toBe(true);
    expect(result.discrepancyResolved).toBe(false);
    expect(result.integrityVerificationResult.amountDiscrepancyDetected).toBe(true);
    expect(result.correctionDifference).toHaveProperty('field4');
    expect(result.correctionDifference.field4.before).toBe(950000);
    expect(result.correctionDifference.field4.after).toBe(980000);
    expect(result.validationReport).toBeDefined();
    expect(result.validationReport.length).toBeGreaterThan(0);
  });
});
