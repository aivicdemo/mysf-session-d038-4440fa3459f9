import { validateCorrectionContentAndJudgeApproval, ApprovalCriteriaNotMetError, CorrectionDataMissingError, DataIntegrityViolationAfterCorrectionError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-095: 修正前後のデータが異なり、すべての承認基準を満たし、整合性も保たれている場合', () => {
  it('修正内容が承認基準を満たし、整合性が保たれている場合、approvedで差分・検証結果・レポートが生成される', async () => {
    const input = {
      discrepancyId: 'DISC-20240115-001',
      correctionBeforeData: {
        field1: 'value1_before',
        field2: 5100000,
        field3: '商談中',
      },
      correctionAfterData: {
        field1: 'value1_before',
        field2: 5000000,
        field3: '成約',
      },
      approvalCriteria: {
        maxAmountDifference: 0,
        requiredFields: ['field1', 'field2', 'field3'],
        validStatusTransitions: ['商談中から成約への遷移を許可'],
      },
      correctionExecutorUserId: 'USER-SALES-0087',
      correctionExecutedAt: new Date('2024-01-15T09:30:00Z'),
      currentDateTime: new Date('2024-01-15T10:00:00Z'),
    };

    const result = await validateCorrectionContentAndJudgeApproval(input);

    expect(result.validationResult).toBe('approved');
    expect(result.correctionDifference).toEqual({
      field2: { before: 5100000, after: 5000000 },
      field3: { before: '商談中', after: '成約' },
    });
    expect(result.approvalCriteriaMet).toBe(true);
    expect(result.integrityVerificationResult).toEqual({
      referenceChainValid: true,
      statusCorrespondenceValid: true,
      amountDiscrepancyDetected: false,
      newDiscrepanciesDetected: [],
    });
    expect(result.discrepancyResolved).toBe(true);
    expect(result.validationReport).toContain('修正項目数');
    expect(result.validationReport).toContain('承認基準充足');
    expect(result.validationReport).toContain('整合性検証合格');
  });
});
