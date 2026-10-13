import { validateToleranceJudgmentInputs } from '../../src/logic/authorization-validation';

describe('SCEN-352: 判定結果が within_tolerance のとき、検証が成功する', () => {
  it('within_toleranceで検証成功となり、isValidがtrueで日時が返される', async () => {
    const result = await validateToleranceJudgmentInputs({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      judgmentResult: 'within_tolerance',
      judgmentReason: '差異額は許容範囲内であり、業務上の問題はありません。',
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
