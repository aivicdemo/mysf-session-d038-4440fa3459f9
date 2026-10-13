import { validateCorrectionContentAndJudgeApproval, CorrectionDataMissingError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-107: 修正前後のデータが不完全または必須項目が欠落している場合', () => {
  it('CorrectionDataMissingErrorが発生する', async () => {
    const input = {
      discrepancyId: 'DISC-20240115-001',
      correctionBeforeData: {
        dealId: 'DEAL-2024-0001',
        amount: 1000000,
        status: 'negotiation',
        customerId: 'CUST-12345',
      },
      correctionAfterData: {
        dealId: 'DEAL-2024-0001',
        amount: null,
        status: 'negotiation',
        customerId: 'CUST-12345',
      },
      approvalCriteria: {
        requiredFields: ['dealId', 'amount', 'status', 'customerId'],
        allowedValues: {
          status: ['negotiation', 'proposal', 'won'],
        },
      },
      correctionExecutorUserId: 'USER-SALES-0042',
      correctionExecutedAt: new Date('2024-01-15T10:30:00Z'),
      currentDateTime: new Date('2024-01-15T10:35:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(
      CorrectionDataMissingError
    );

    try {
      await validateCorrectionContentAndJudgeApproval(input);
    } catch (error) {
      if (error instanceof CorrectionDataMissingError) {
        expect(error.message).toContain('修正前後のデータが不完全です。必須項目を確認してください。');
      }
    }
  });
});
