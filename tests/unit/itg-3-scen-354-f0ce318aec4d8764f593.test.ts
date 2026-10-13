import { validateToleranceJudgmentInputs } from '../../src/logic/authorization-validation';

describe('SCEN-354: 判定結果が requires_review のとき、検証が成功する', () => {
  it('requires_reviewで検証成功となり、isValidがtrueで日時が返される', async () => {
    const result = await validateToleranceJudgmentInputs({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      judgmentResult: 'requires_review',
      judgmentReason: 'データソース間の時間差により確認が必要です',
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
