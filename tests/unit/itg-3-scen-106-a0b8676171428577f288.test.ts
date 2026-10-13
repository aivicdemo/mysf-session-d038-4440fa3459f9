import { validateCorrectionContentAndJudgeApproval, InvalidUserAuthorizationError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-106: 修正実行者が修正内容の検証を実行する権限を持たない場合', () => {
  it('InvalidUserAuthorizationErrorが発生する', async () => {
    const input = {
      discrepancyId: 'DISC-2024-00001',
      correctionBeforeData: {
        dealId: 'DEAL-2024-00042',
        clientId: 'CLIENT-2024-001',
        amount: 1500000,
        status: 'proposal',
      },
      correctionAfterData: {
        dealId: 'DEAL-2024-00042',
        clientId: 'CLIENT-2024-001',
        amount: 1520000,
        status: 'won',
      },
      approvalCriteria: {
        maxAmountDifference: 100000,
        requiredFields: ['dealId', 'clientId', 'amount', 'status'],
        validStatusTransitions: [{ from: 'proposal', to: 'won' }],
      },
      correctionExecutorUserId: 'USR-SALESREP-999',
      correctionExecutedAt: new Date('2024-01-15T14:30:00Z'),
      currentDateTime: new Date('2024-01-15T15:00:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(
      InvalidUserAuthorizationError
    );

    try {
      await validateCorrectionContentAndJudgeApproval(input);
    } catch (error) {
      if (error instanceof InvalidUserAuthorizationError) {
        expect(error.message).toContain('この操作を実行する権限がありません。');
      }
    }
  });
});
