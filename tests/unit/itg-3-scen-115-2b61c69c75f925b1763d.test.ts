import { validateCorrectionContentAndJudgeApproval } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-115: 修正実行日時と現在日時が入力型の値として与えられ、レポート生成時に使用される', () => {
  it('should return approved validation result with correctionExecutedAt and currentDateTime used in report', async () => {
    const correctionExecutedAt = new Date('2025-01-07T10:30:00Z');
    const currentDateTime = new Date('2025-01-07T11:45:00Z');

    const input = {
      discrepancyId: 'DISC-20250107-001',
      correctionBeforeData: {
        field1: 'value1_before',
        field2: 950000,
        field3: 'status_before',
      },
      correctionAfterData: {
        field1: 'value1_before',
        field2: 1000000,
        field3: 'status_after',
      },
      approvalCriteria: {
        criterion1: 'rule1',
        criterion2: 10000,
        criterion3: ['field1', 'field2', 'field3'],
      },
      correctionExecutorUserId: 'USER-SALES-0042',
      correctionExecutedAt,
      currentDateTime,
    };

    const output = await validateCorrectionContentAndJudgeApproval(input);

    expect(output.validationResult).toBe('approved');

    expect(output.correctionDifference).toEqual({
      field2: { before: 950000, after: 1000000 },
      field3: { before: 'status_before', after: 'status_after' },
    });

    expect(output.approvalCriteriaMet).toBe(true);

    expect(output.integrityVerificationResult.referenceChainValid).toBe(true);
    expect(output.integrityVerificationResult.statusCorrespondenceValid).toBe(true);
    expect(output.integrityVerificationResult.amountDiscrepancyDetected).toBe(false);
    expect(output.integrityVerificationResult.newDiscrepanciesDetected).toEqual([]);

    expect(output.discrepancyResolved).toBe(true);

    expect(output.validationReport).toContain('discrepancyId: DISC-20250107-001');
    expect(output.validationReport).toContain('修正実行者: USER-SALES-0042');
    expect(output.validationReport).toContain('2025-01-07T10:30:00');
    expect(output.validationReport).toContain('2025-01-07T11:45:00');
    expect(output.validationReport).toContain('修正前field2: 950000');
    expect(output.validationReport).toContain('修正後field2: 1000000');
    expect(output.validationReport).toContain('修正前field3: status_before');
    expect(output.validationReport).toContain('修正後field3: status_after');
    expect(output.validationReport).toContain('承認基準判定: 満たす');
    expect(output.validationReport).toContain('参照チェーン有効');
    expect(output.validationReport).toContain('ステータス対応有効');
    expect(output.validationReport).toContain('金額ズレなし');
    expect(output.validationReport).toContain('新規不整合なし');
  });
});
