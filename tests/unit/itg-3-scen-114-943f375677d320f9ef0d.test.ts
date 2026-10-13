import { validateCorrectionContentAndJudgeApproval } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-114: 是正後のデータが是正前より悪化している場合、警告がレポートに含まれる', () => {
  it('validationResult が requires_manual_review で、警告メッセージが含まれる', async () => {
    const input = {
      discrepancyId: 'DIFF-2024-001',
      correctionBeforeData: {
        dealId: 'DEAL-12345',
        amount: 1000000,
        currency: 'JPY',
        accountId: 'ACC-001',
        status: 'Closed Won',
        itemCount: 5,
        totalAmount: 950000,
      },
      correctionAfterData: {
        dealId: 'DEAL-12345',
        amount: 1000000,
        currency: 'JPY',
        accountId: 'ACC-001',
        status: 'Closed Won',
        itemCount: 4,
        totalAmount: 900000,
      },
      approvalCriteria: {
        amountTolerance: 50000,
        itemCountTolerance: 2,
        requiredFields: ['dealId', 'amount', 'accountId', 'status'],
        allowedStatusTransitions: [
          'Prospecting',
          'Qualification',
          'Needs Analysis',
          'Value Proposition',
          'Closed Won',
        ],
      },
      correctionExecutorUserId: 'USER-OP-001',
      correctionExecutedAt: new Date('2024-10-15T10:30:00Z'),
      currentDateTime: new Date('2024-10-15T11:00:00Z'),
    };

    const result = await validateCorrectionContentAndJudgeApproval(input);

    expect(result.validationResult).toBe('requires_manual_review');
    expect(result.validationReport).toContain('是正によってデータ品質が低下しています。是正内容を再確認してください');
    expect(result.correctionDifference.itemCount.before).toBe(5);
    expect(result.correctionDifference.itemCount.after).toBe(4);
    expect(result.correctionDifference.totalAmount.before).toBe(950000);
    expect(result.correctionDifference.totalAmount.after).toBe(900000);
    expect(result.integrityVerificationResult.newDiscrepanciesDetected.length).toBeGreaterThan(0);
    expect(result.discrepancyResolved).toBe(false);
  });
});
