import { validateCorrectionContentAndJudgeApproval, ApprovalCriteriaNotMetError, CorrectionDataMissingError, DataIntegrityViolationAfterCorrectionError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-096: 修正前後のデータを比較し、承認基準に照らし合わせ、金額ズレ・必須フィールド・ステータス遷移をすべてチェック', () => {
  it('金額ズレと必須フィールドとステータス遷移のすべてを満たす場合、approvedで詳細な検証結果が返される', async () => {
    const input = {
      discrepancyId: 'DSC-2025-0001',
      correctionBeforeData: {
        dealId: 'DEAL-12345',
        dealName: 'ABC商談',
        accountId: 'ACC-001',
        amount: 1000000,
        status: '商談中',
        billingRecordId: 'BIL-001',
        billingAmount: 950000,
        billingStatus: '未発行',
        billingDate: '2025-01-15',
      },
      correctionAfterData: {
        dealId: 'DEAL-12345',
        dealName: 'ABC商談',
        accountId: 'ACC-001',
        amount: 1000000,
        status: '成約',
        billingRecordId: 'BIL-001',
        billingAmount: 1000000,
        billingStatus: '発行済み',
        billingDate: '2025-01-15',
      },
      approvalCriteria: {
        maxAmountDiscrepancy: 50000,
        maxAmountDiscrepancyPercent: 5,
        requiredFields: ['dealId', 'amount', 'status', 'billingAmount', 'billingStatus'],
        statusTransitionRules: [
          { from: '商談中', to: '成約' },
          { from: '商談中', to: '失注' },
        ],
        billingStatusTransitionRules: [
          { from: '未発行', to: '発行済み' },
          { from: '発行済み', to: '支払済み' },
        ],
        amountAndBillingAmountMustMatch: true,
      },
      correctionExecutorUserId: 'USER-002',
      correctionExecutedAt: new Date('2025-01-20T10:30:00Z'),
      currentDateTime: new Date('2025-01-20T11:00:00Z'),
    };

    const result = await validateCorrectionContentAndJudgeApproval(input);

    expect(result.validationResult).toBe('approved');
    expect(result.correctionDifference).toHaveProperty('status');
    expect(result.correctionDifference.status).toEqual({ before: '商談中', after: '成約' });
    expect(result.correctionDifference).toHaveProperty('billingAmount');
    expect(result.correctionDifference.billingAmount).toEqual({ before: 950000, after: 1000000 });
    expect(result.correctionDifference).toHaveProperty('billingStatus');
    expect(result.correctionDifference.billingStatus).toEqual({ before: '未発行', after: '発行済み' });
    expect(result.approvalCriteriaMet).toBe(true);
    expect(result.integrityVerificationResult).toEqual(
      expect.objectContaining({
        referenceChainValid: true,
        statusCorrespondenceValid: true,
        amountDiscrepancyDetected: false,
        newDiscrepanciesDetected: [],
      })
    );
    expect(result.discrepancyResolved).toBe(true);
    expect(result.validationReport).toContain('修正内容');
    expect(result.validationReport).toContain('承認基準');
    expect(result.validationReport).toContain('整合性検証');
  });
});
