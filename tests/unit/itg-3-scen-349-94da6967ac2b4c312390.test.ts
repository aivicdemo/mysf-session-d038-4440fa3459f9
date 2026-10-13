import { validateToleranceJudgmentInputs, InvalidInputType } from '../../src/logic/authorization-validation';

describe('SCEN-349: validateToleranceJudgmentInputs - 入力型エラー', () => {
  it('discrepancyId が数値のとき、検証に失敗し InvalidInputType エラーが発生する', async () => {
    const input = {
      discrepancyId: 123 as any,
      judgmentResult: 'within_tolerance',
      judgmentReason: 'テスト用の判定根拠',
    };

    await expect(validateToleranceJudgmentInputs(input)).rejects.toThrow(InvalidInputType);
  });

  it('discrepancyId が真偽値のとき、検証に失敗し InvalidInputType エラーが発生する', async () => {
    const input = {
      discrepancyId: true as any,
      judgmentResult: 'within_tolerance',
      judgmentReason: 'テスト用の判定根拠',
    };

    await expect(validateToleranceJudgmentInputs(input)).rejects.toThrow(InvalidInputType);
  });

  it('discrepancyId がオブジェクトのとき、検証に失敗し InvalidInputType エラーが発生する', async () => {
    const input = {
      discrepancyId: {} as any,
      judgmentResult: 'within_tolerance',
      judgmentReason: 'テスト用の判定根拠',
    };

    await expect(validateToleranceJudgmentInputs(input)).rejects.toThrow(InvalidInputType);
  });

  it('discrepancyId が配列のとき、検証に失敗し InvalidInputType エラーが発生する', async () => {
    const input = {
      discrepancyId: [] as any,
      judgmentResult: 'within_tolerance',
      judgmentReason: 'テスト用の判定根拠',
    };

    await expect(validateToleranceJudgmentInputs(input)).rejects.toThrow(InvalidInputType);
  });
});
