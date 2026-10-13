import { validateCorrectionContentAndJudgeApproval } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-111: 参照チェーンが有効で、ステータス対応ルールを満たし、金額ズレが検出されない場合、整合性検証がすべて成功する', () => {
  it('整合性検証がすべて成功し、詳細レポートが返される', async () => {
    const input = {
      discrepancyId: 'DISC-20250107-001',
      correctionBeforeData: {
        dealId: 'DEAL-2024-0512',
        accountId: 'ACC-00123',
        dealAmount: 1500000,
        dealStatus: 'negotiation',
        invoiceAmount: 1500000,
        invoiceStatus: 'draft',
        paymentTerms: 'Net 30',
      },
      correctionAfterData: {
        dealId: 'DEAL-2024-0512',
        accountId: 'ACC-00123',
        dealAmount: 1500000,
        dealStatus: 'closed_won',
        invoiceAmount: 1500000,
        invoiceStatus: 'issued',
        paymentTerms: 'Net 30',
      },
      approvalCriteria: {
        amountToleranceRange: 0,
        requiredFields: ['dealId', 'accountId', 'dealAmount', 'invoiceAmount'],
        statusTransitionRules: {
          dealStatus: ['negotiation', 'closed_won'],
          invoiceStatus: ['draft', 'issued'],
        },
        referenceIntegrityChecks: true,
      },
      correctionExecutorUserId: 'USER-sales-001',
      correctionExecutedAt: new Date('2025-01-07T09:30:00Z'),
      currentDateTime: new Date('2025-01-07T09:35:00Z'),
    };

    const result = await validateCorrectionContentAndJudgeApproval(input);

    expect(result.validationResult).toBe('approved');
    expect(result.correctionDifference.dealStatus.before).toBe('negotiation');
    expect(result.correctionDifference.dealStatus.after).toBe('closed_won');
    expect(result.correctionDifference.invoiceStatus.before).toBe('draft');
    expect(result.correctionDifference.invoiceStatus.after).toBe('issued');
    expect(result.approvalCriteriaMet).toBe(true);
    expect(result.integrityVerificationResult.referenceChainValid).toBe(true);
    expect(result.integrityVerificationResult.statusCorrespondenceValid).toBe(true);
    expect(result.integrityVerificationResult.amountDiscrepancyDetected).toBe(false);
    expect(result.integrityVerificationResult.newDiscrepanciesDetected).toEqual([]);
    expect(result.discrepancyResolved).toBe(true);
    expect(result.validationReport).toBeDefined();
    expect(result.validationReport.length).toBeGreaterThan(0);
  });
});
