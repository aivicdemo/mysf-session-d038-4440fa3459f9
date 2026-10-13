import { validateCorrectionContentAndJudgeApproval } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-110: 修正前後のデータを比較して変更があった項目と変更値が正確に抽出される', () => {
  it('3つの相違が正確に抽出される', async () => {
    const input = {
      discrepancyId: 'DISC-2024-001',
      correctionBeforeData: {
        dealId: 'DEAL-12345',
        accountName: '株式会社ABC',
        dealAmount: 1000000,
        dealStatus: '提案中',
        invoiceAmount: 950000,
        invoiceStatus: '未発行',
      },
      correctionAfterData: {
        dealId: 'DEAL-12345',
        accountName: '株式会社ABC',
        dealAmount: 1000000,
        dealStatus: '受注',
        invoiceAmount: 1000000,
        invoiceStatus: '発行済',
      },
      approvalCriteria: {
        maxAmountDifference: 50000,
        requiredFields: ['dealId', 'accountName', 'dealAmount', 'dealStatus'],
        validStatusTransitions: {
          提案中: ['受注', '失注'],
          受注: ['請求済'],
        },
      },
      correctionExecutorUserId: 'USR-SALES-001',
      correctionExecutedAt: new Date('2024-10-15T10:30:00Z'),
      currentDateTime: new Date('2024-10-15T11:00:00Z'),
    };

    const result = await validateCorrectionContentAndJudgeApproval(input);

    expect(result.validationResult).toBe('approved');
    expect(result.correctionDifference.dealStatus.before).toBe('提案中');
    expect(result.correctionDifference.dealStatus.after).toBe('受注');
    expect(result.correctionDifference.invoiceAmount.before).toBe(950000);
    expect(result.correctionDifference.invoiceAmount.after).toBe(1000000);
    expect(result.correctionDifference.invoiceStatus.before).toBe('未発行');
    expect(result.correctionDifference.invoiceStatus.after).toBe('発行済');
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
