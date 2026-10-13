import { validateToleranceJudgmentInputs } from '../../src/logic/authorization-validation';

describe('SCEN-353: 判定結果が exceeds_tolerance のとき、検証が成功する', () => {
  it('exceeds_toleranceで検証成功となり、isValidがtrueで日時が返される', async () => {
    const result = await validateToleranceJudgmentInputs({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      judgmentResult: 'exceeds_tolerance',
      judgmentReason: '差異額が許容範囲を超過しました。請求額と実績額の差分が契約上の許容率を上回っています。',
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
