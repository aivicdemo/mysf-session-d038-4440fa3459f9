import { validateCorrectionContentAndJudgeApproval, ApprovalCriteriaNotMetError } from '../../src/logic/correction-content-validation-engine';

describe('SCEN-099: 金額ズレが承認基準の許容範囲を超える場合', () => {
  it('金額ズレが承認基準を超える場合、ApprovalCriteriaNotMetErrorがスローされる', async () => {
    const input = {
      discrepancyId: 'DISC-20250107-001',
      correctionBeforeData: {
        field1: 'value1_before',
        field2: 1000000,
        field3: 950000,
        field4: 'CUST-A',
        field5: 'status1',
      },
      correctionAfterData: {
        field1: 'value1_before',
        field2: 1500000,
        field3: 950000,
        field4: 'CUST-A',
        field5: 'status1',
      },
      approvalCriteria: {
        threshold_amount: 100000,
        required_fields: ['field1', 'field2', 'field3', 'field4', 'field5'],
        valid_transitions: ['status1', 'status2', 'status3'],
      },
      correctionExecutorUserId: 'USER-SALES-001',
      correctionExecutedAt: new Date('2025-01-07T10:30:00Z'),
      currentDateTime: new Date('2025-01-07T10:35:00Z'),
    };

    await expect(validateCorrectionContentAndJudgeApproval(input)).rejects.toThrow(ApprovalCriteriaNotMetError);
  });
});
