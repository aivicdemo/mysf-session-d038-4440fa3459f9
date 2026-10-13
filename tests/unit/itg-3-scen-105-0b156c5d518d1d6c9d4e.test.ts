import { validateCorrectionContentAndJudgeApproval, DiscrepancyIdNotFoundError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-105: 指定された差異IDが存在しない場合、DiscrepancyIdNotFoundErrorが発生する', () => {
  it('存在しない差異IDを指定した場合、DiscrepancyIdNotFoundErrorがスローされる', async () => {
    const input = {
      discrepancyId: 'nonexistent-discrepancy-999',
      correctionBeforeData: {
        dealId: 'DEAL-001',
        amount: 1000000,
        status: 'negotiation',
      },
      correctionAfterData: {
        dealId: 'DEAL-001',
        amount: 1050000,
        status: 'closed_won',
      },
      approvalCriteria: {
        tolerance: 5,
        requiredFields: ['dealId', 'amount', 'status'],
        validTransitions: ['negotiation->closed_won', 'negotiation->closed_lost'],
      },
      correctionExecutorUserId: 'user-sales-001',
      correctionExecutedAt: new Date('2026-01-15T10:30:00.000Z'),
      currentDateTime: new Date('2026-01-15T11:00:00.000Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(DiscrepancyIdNotFoundError);
    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow('指定された差異が見つかりません。');
  });
});
