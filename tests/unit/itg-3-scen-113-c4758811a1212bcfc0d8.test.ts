import { validateCorrectionContentAndJudgeApproval } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-113: 許容閾値が負の数または0の場合、例外が発生する', () => {
  it('許容閾値が0のとき、エラーが発生する', async () => {
    const input = {
      discrepancyId: 'DISC-2024-001',
      correctionBeforeData: {
        dealId: 'DEAL-12345',
        amount: 950000,
        status: 'negotiation',
        accountId: 'ACC-001',
      },
      correctionAfterData: {
        dealId: 'DEAL-12345',
        amount: 1000000,
        status: 'closed_won',
        accountId: 'ACC-001',
      },
      approvalCriteria: {
        maxAmountDifference: 50000,
        requiredFields: ['dealId', 'amount', 'status', 'accountId'],
        allowedStatusTransitions: [
          {
            from: 'negotiation',
            to: 'closed_won',
          },
        ],
        toleranceThreshold: 0,
      },
      correctionExecutorUserId: 'USER-SALES-001',
      correctionExecutedAt: new Date('2024-01-15T10:30:00Z'),
      currentDateTime: new Date('2024-01-15T11:00:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow();

    try {
      await validateCorrectionContentAndJudgeApproval(input);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain('許容閾値は正の数で指定してください');
      }
    }
  });
});
