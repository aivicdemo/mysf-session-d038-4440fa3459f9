import { validateCorrectionContentAndJudgeApproval } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-097: 修正前後のデータが同一で、変更内容が検出されない場合', () => {
  it('修正前後のデータが同一の場合、requires_manual_reviewが返り、警告メッセージが含まれる', async () => {
    const input = {
      discrepancyId: 'DIFF-2024-001',
      correctionBeforeData: {
        dealId: 'DEAL-001',
        accountName: 'ABC Corp',
        amount: 1000000,
        status: '商談中',
        invoiceId: 'INV-001',
        invoiceAmount: 1000000,
      },
      correctionAfterData: {
        dealId: 'DEAL-001',
        accountName: 'ABC Corp',
        amount: 1000000,
        status: '商談中',
        invoiceId: 'INV-001',
        invoiceAmount: 1000000,
      },
      approvalCriteria: {
        allowedAmountVariance: 10000,
        requiredFields: ['accountName', 'amount', 'status'],
        validStatusTransitions: ['商談中', 'クローズ_勝ち', 'クローズ_負け'],
      },
      correctionExecutorUserId: 'USER-SALES-001',
      correctionExecutedAt: new Date('2024-01-15T10:30:00Z'),
      currentDateTime: new Date('2024-01-15T10:35:00Z'),
    };

    const result = await validateCorrectionContentAndJudgeApproval(input);

    expect(result.validationResult).toBe('requires_manual_review');
    expect(result.correctionDifference).toEqual({});
    expect(result.approvalCriteriaMet).toBe(true);
    expect(result.integrityVerificationResult).toEqual({
      referenceChainValid: true,
      statusCorrespondenceValid: true,
      amountDiscrepancyDetected: false,
      newDiscrepanciesDetected: [],
    });
    expect(result.discrepancyResolved).toBe(false);
    expect(result.validationReport).toContain('修正内容が検出されません。変更があったか確認してください');
  });
});
