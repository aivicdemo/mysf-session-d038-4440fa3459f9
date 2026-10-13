import {
  validateCorrectionContentAndJudgeApproval,
  ApprovalCriteriaNotMetError,
  ValidateCorrectionContentAndJudgeApprovalInput,
} from '../../src/logic/correction-content-validation-engine';

describe('SCEN-098: 修正理由が空または10文字未満の場合、例外が発生する', () => {
  it('修正理由が空または10文字未満の場合、ApprovalCriteriaNotMetErrorが発生する', async () => {
    const input: ValidateCorrectionContentAndJudgeApprovalInput = {
      discrepancyId: 'DISC-20240115-001',
      correctionBeforeData: {
        dealId: 'DEAL-2024-0050',
        amount: 1500000,
        accountName: 'ABC Corporation',
        status: '商談',
      },
      correctionAfterData: {
        dealId: 'DEAL-2024-0050',
        amount: 1520000,
        accountName: 'ABC Corporation',
        status: '受注',
      },
      approvalCriteria: {
        maxAmountDifference: 100000,
        requiredFields: ['dealId', 'amount', 'accountName', 'status'],
        validStatusTransitions: [
          { from: '商談', to: '受注' },
          { from: '受注', to: '請求済' },
        ],
      },
      correctionExecutorUserId: 'USER-SALES-2024-0123',
      correctionExecutedAt: new Date('2024-01-15T10:30:00Z'),
      currentDateTime: new Date('2024-01-15T11:00:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(
      ApprovalCriteriaNotMetError,
    );

    try {
      await validateCorrectionContentAndJudgeApproval(input);
      fail('Should have thrown ApprovalCriteriaNotMetError');
    } catch (error) {
      expect(error).toBeInstanceOf(ApprovalCriteriaNotMetError);
      expect((error as Error).message).toBe('修正内容が承認基準を満たしていません。');
    }
  });
});
