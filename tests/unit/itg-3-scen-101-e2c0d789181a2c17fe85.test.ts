import { validateCorrectionContentAndJudgeApproval, DataIntegrityViolationAfterCorrectionError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-101: ステータス遷移が営業プロセスルールに違反している場合', () => {
  it('ステータス遷移が営業プロセスルールに違反している場合、DataIntegrityViolationAfterCorrectionErrorがスローされる', async () => {
    const input = {
      discrepancyId: 'DISC-2024-001',
      correctionBeforeData: {
        dealId: 'DEAL-1001',
        dealStatus: 'negotiation',
        amount: 1000000,
        accountId: 'ACC-100',
        productId: 'PROD-A',
      },
      correctionAfterData: {
        dealId: 'DEAL-1001',
        dealStatus: 'closed_lost',
        amount: 1000000,
        accountId: 'ACC-100',
        productId: 'PROD-A',
      },
      approvalCriteria: {
        validStatusTransitions: ['negotiation→proposal', 'proposal→decision', 'decision→closed_won', 'negotiation→closed_lost'],
        amountToleranceRangePercent: 5,
        requiredFields: ['dealId', 'dealStatus', 'amount', 'accountId'],
      },
      correctionExecutorUserId: 'USER-SALES-001',
      correctionExecutedAt: new Date('2024-12-15T10:00:00Z'),
      currentDateTime: new Date('2024-12-15T10:05:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(DataIntegrityViolationAfterCorrectionError);
  });
});
