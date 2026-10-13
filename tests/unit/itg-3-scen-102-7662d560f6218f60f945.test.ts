import { validateCorrectionContentAndJudgeApproval, ApprovalCriteriaMissingError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-102: 承認基準が指定されていない場合、ApprovalCriteriaMissingErrorが発生する', () => {
  it('承認基準がnullの場合、ApprovalCriteriaMissingErrorがスローされる', async () => {
    const input = {
      discrepancyId: 'DISC-20250107-001',
      correctionBeforeData: {
        dealId: 'DEAL-2025-0001',
        amount: 1000000,
        status: '商談中',
      },
      correctionAfterData: {
        dealId: 'DEAL-2025-0001',
        amount: 1050000,
        status: '受注',
      },
      approvalCriteria: null,
      correctionExecutorUserId: 'USER-SALES-0123',
      correctionExecutedAt: new Date('2025-01-07T10:30:00Z'),
      currentDateTime: new Date('2025-01-07T11:00:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(ApprovalCriteriaMissingError);
    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow('承認基準が指定されていません。');
  });
});
