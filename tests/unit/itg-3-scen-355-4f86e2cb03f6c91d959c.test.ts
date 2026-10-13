import { validateToleranceJudgmentInputs } from '../../src/logic/authorization-validation';

describe('SCEN-355: 差異IDが有効なUUID形式のとき、検証が成功する', () => {
  it('UUID形式の差異IDで検証成功となり、isValidがtrueで日時が返される', async () => {
    const result = await validateToleranceJudgmentInputs({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      judgmentResult: 'within_tolerance',
      judgmentReason: '差異額が許容範囲内であることを確認しました。',
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
