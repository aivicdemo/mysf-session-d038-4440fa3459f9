import { validateToleranceJudgmentInputs, InvalidDiscrepancyIdFormat } from '../../src/logic/authorization-validation';

describe('SCEN-347: validateToleranceJudgmentInputs - UUID形式エラー', () => {
  it('差異IDが UUID形式に準拠していないとき、検証に失敗し InvalidDiscrepancyIdFormat エラーが発生する', async () => {
    const input = {
      discrepancyId: 'not-a-uuid',
      judgmentResult: 'within_tolerance',
      judgmentReason: '検証対象の差異は事前定義の許容範囲内である',
    };

    await expect(validateToleranceJudgmentInputs(input)).rejects.toThrow(InvalidDiscrepancyIdFormat);
  });
});
