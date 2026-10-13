import { validateCorrectionContentAndJudgeApproval, DataIntegrityViolationAfterCorrectionError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-112: 是正前後のデータスナップショットが存在しない場合、例外が発生する', () => {
  it('DataIntegrityViolationAfterCorrectionErrorが発生する', async () => {
    const input = {
      discrepancyId: 'DISC-20250115-001',
      correctionBeforeData: {
        dealId: 'DEAL-2025-0001',
        amount: 1000000,
        status: 'negotiation',
        clientId: 'CLIENT-0001',
      },
      correctionAfterData: {
        dealId: 'DEAL-2025-0001',
        amount: 1050000,
        status: 'won',
        clientId: 'CLIENT-0001',
      },
      approvalCriteria: {
        maxAmountDifference: 100000,
        requiredFields: ['dealId', 'amount', 'status', 'clientId'],
        validStatusTransitions: ['negotiation->won', 'negotiation->lost'],
      },
      correctionExecutorUserId: 'USER-002-SALES',
      correctionExecutedAt: new Date('2025-01-15T10:30:00Z'),
      currentDateTime: new Date('2025-01-15T11:00:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(
      DataIntegrityViolationAfterCorrectionError
    );

    try {
      await validateCorrectionContentAndJudgeApproval(input);
    } catch (error) {
      if (error instanceof DataIntegrityViolationAfterCorrectionError) {
        expect(error.message).toContain('修正後のデータに整合性違反が検出されました。');
      }
    }
  });
});
