import { validateCorrectionContentAndJudgeApproval, DataIntegrityViolationAfterCorrectionError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-104: 修正後のデータが参照チェーン・ステータス対応ルール・金額ズレの観点で整合性を失っている場合、DataIntegrityViolationAfterCorrectionErrorが発生する', () => {
  it('修正後のデータ整合性検証で referenceChainValid=false かつ amountDiscrepancyDetected=true の場合、DataIntegrityViolationAfterCorrectionErrorがスローされる', async () => {
    const input = {
      discrepancyId: 'DIFF-20250115-001',
      correctionBeforeData: {
        dealId: 'DEAL-2025-001',
        amount: 1000000,
        status: 'contract_signed',
        invoiceAmount: 950000,
      },
      correctionAfterData: {
        dealId: 'DEAL-2025-001',
        amount: 1000000,
        status: 'contract_signed',
        invoiceAmount: 1000000,
      },
      approvalCriteria: {
        amountThreshold: 10000,
        mandatoryFields: ['dealId', 'amount', 'status'],
        statusTransitionRules: {
          draft: ['proposal_sent'],
          proposal_sent: ['negotiating', 'lost'],
          negotiating: ['contract_signed', 'lost'],
          contract_signed: ['invoiced', 'cancelled'],
        },
      },
      correctionExecutorUserId: 'USER-SALES-001',
      correctionExecutedAt: new Date('2025-01-15T10:30:00Z'),
      currentDateTime: new Date('2025-01-15T11:00:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(DataIntegrityViolationAfterCorrectionError);
    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow('修正後のデータに整合性違反が検出されました。');
  });
});
