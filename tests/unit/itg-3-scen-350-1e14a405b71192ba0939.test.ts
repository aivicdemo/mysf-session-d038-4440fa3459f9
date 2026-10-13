import { validateToleranceJudgmentInputs } from '../../src/logic/authorization-validation';

describe('SCEN-350: 判定根拠が1文字のとき、検証が成功する', () => {
  it('1文字の判定根拠で検証成功となり、isValidがtrueで日時が返される', async () => {
    const result = await validateToleranceJudgmentInputs({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      judgmentResult: 'within_tolerance',
      judgmentReason: 'a',
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
