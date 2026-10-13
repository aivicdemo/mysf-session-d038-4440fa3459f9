import { validateToleranceJudgmentInputs, MissingDiscrepancyId, MissingJudgmentResult, MissingJudgmentReason, InvalidDiscrepancyIdFormat, InvalidJudgmentResultValue, InvalidJudgmentReasonLength, InvalidInputType } from '../../src/logic/authorization-validation';

describe('SCEN-345: validateToleranceJudgmentInputs - 正常系', () => {
  it('すべての必須項目が正常な形式で入力されたとき、検証が成功し isValid=true と検証実行日時を返す', async () => {
    const input = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      judgmentResult: 'within_tolerance',
      judgmentReason: '差異額が許容範囲内の500円以下であるため、許容範囲内と判定します。',
    };

    const result = await validateToleranceJudgmentInputs(input);

    expect(result.isValid).toBe(true);
    expect(typeof result.validatedAt).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(result.validatedAt)).toBe(true);
  });
});
