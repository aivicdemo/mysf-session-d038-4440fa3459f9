import { validateCorrectionContentAndJudgeApproval, ApprovalCriteriaNotMetError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-103: 修正内容が承認基準を満たさない場合、ApprovalCriteriaNotMetErrorが発生し、validationResultがrejectedになる', () => {
  it('承認基準充足判定が false を返す場合、ApprovalCriteriaNotMetErrorがスローされる', async () => {
    const input = {
      discrepancyId: 'DISC-2024-001',
      correctionBeforeData: {
        dealId: 'DEAL-2024-0001',
        amount: 1000000,
        status: '商談確定',
        relatedInvoiceAmount: 950000,
        relatedInvoiceStatus: '請求待ち',
      },
      correctionAfterData: {
        dealId: 'DEAL-2024-0001',
        amount: 1000000,
        status: '商談確定',
        relatedInvoiceAmount: 1000000,
        relatedInvoiceStatus: '請求待ち',
      },
      approvalCriteria: {
        allowedAmountDifference: 10000,
        allowedStatusTransitions: ['商談確定→請求待ち', '請求待ち→請求済'],
        mandatoryFields: ['dealId', 'amount', 'status'],
      },
      correctionExecutorUserId: 'USER-2024-0123',
      correctionExecutedAt: new Date('2024-12-15T10:30:00Z'),
      currentDateTime: new Date('2024-12-15T11:00:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(ApprovalCriteriaNotMetError);
    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow('修正内容が承認基準を満たしていません。');
  });
});
