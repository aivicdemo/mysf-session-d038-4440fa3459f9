import { validateCorrectionContentAndJudgeApproval } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-108: 修正により元の差異が解消され、discrepancyResolvedがtrueになる', () => {
  it('修正結果が承認され、discrepancyResolvedがtrueで返される', async () => {
    const input = {
      discrepancyId: 'DISC-2024-00001',
      correctionBeforeData: {
        dealId: 'DEAL-2024-0042',
        accountName: '株式会社A',
        amount: 1450000,
        status: '請求待ち',
        paymentStatus: '未払い',
      },
      correctionAfterData: {
        dealId: 'DEAL-2024-0042',
        accountName: '株式会社A',
        amount: 1500000,
        status: '請求済み',
        paymentStatus: '未払い',
      },
      approvalCriteria: {
        amountTolerance: 50000,
        mandatoryFields: ['dealId', 'accountName', 'amount'],
        statusTransitionRules: {
          status: ['請求待ち', '請求済み', '入金済み'],
        },
      },
      correctionExecutorUserId: 'USER-001',
      correctionExecutedAt: new Date('2024-01-15T10:30:00Z'),
      currentDateTime: new Date('2024-01-15T11:00:00Z'),
    };

    const result = await validateCorrectionContentAndJudgeApproval(input);

    expect(result.validationResult).toBe('approved');
    expect(result.approvalCriteriaMet).toBe(true);
    expect(result.discrepancyResolved).toBe(true);
    expect(result.integrityVerificationResult.referenceChainValid).toBe(true);
    expect(result.integrityVerificationResult.statusCorrespondenceValid).toBe(true);
    expect(result.integrityVerificationResult.amountDiscrepancyDetected).toBe(false);
    expect(result.integrityVerificationResult.newDiscrepanciesDetected).toEqual([]);
    expect(result.correctionDifference).toHaveProperty('amount');
    expect(result.correctionDifference).toHaveProperty('status');
    expect(result.validationReport).toBeDefined();
    expect(result.validationReport.length).toBeGreaterThan(0);
  });
});
