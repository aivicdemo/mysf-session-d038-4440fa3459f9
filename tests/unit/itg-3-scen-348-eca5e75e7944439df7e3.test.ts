import { validateToleranceJudgmentInputs, InvalidJudgmentResultValue } from '../../src/logic/authorization-validation';

describe('SCEN-348: validateToleranceJudgmentInputs - 許容値範囲エラー', () => {
  it('判定結果が許容値のいずれでもないとき、検証に失敗し InvalidJudgmentResultValue エラーが発生する', async () => {
    const input = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      judgmentResult: 'invalid_status',
      judgmentReason: 'この判定は許容範囲外です',
    };

    await expect(validateToleranceJudgmentInputs(input)).rejects.toThrow(InvalidJudgmentResultValue);
  });
});
