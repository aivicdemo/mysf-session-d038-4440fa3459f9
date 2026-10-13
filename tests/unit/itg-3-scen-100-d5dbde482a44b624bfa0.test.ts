import { validateCorrectionContentAndJudgeApproval, CorrectionDataMissingError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-100: 必須フィールド（取引先、商談金額等）が空の場合', () => {
  it('修正後データの必須フィールド（account）が空の場合、CorrectionDataMissingErrorがスローされる', async () => {
    const input = {
      discrepancyId: 'DISC-2024-001',
      correctionBeforeData: {
        dealId: 'DEAL-20240115-001',
        account: '株式会社ABC商事',
        amount: 5000000,
        status: '交渉中',
        billingAmount: 5000000,
        billingStatus: '未請求',
      },
      correctionAfterData: {
        dealId: 'DEAL-20240115-001',
        account: '',
        amount: 5500000,
        status: '成約',
        billingAmount: 5500000,
        billingStatus: '請求済',
      },
      approvalCriteria: {
        requiredFields: ['account', 'amount', 'billingAmount'],
        amountTolerancePercent: 5,
        validStatusTransitions: {
          status: ['交渉中→成約', '交渉中→失注'],
          billingStatus: ['未請求→請求済', '請求済→入金済'],
        },
      },
      correctionExecutorUserId: 'USER-SALES-0042',
      correctionExecutedAt: new Date('2024-01-16T09:30:00Z'),
      currentDateTime: new Date('2024-01-16T10:00:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(CorrectionDataMissingError);
  });
});
