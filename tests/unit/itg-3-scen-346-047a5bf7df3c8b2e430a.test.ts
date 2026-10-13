import { validateToleranceJudgmentInputs, MissingDiscrepancyId } from '../../src/logic/authorization-validation';

describe('SCEN-346: validateToleranceJudgmentInputs - 必須項目エラー', () => {
  it('差異IDが null のとき、検証に失敗し MissingDiscrepancyId エラーが発生する', async () => {
    const input = {
      discrepancyId: null as any,
      judgmentResult: 'within_tolerance',
      judgmentReason: '判定根拠の説明',
    };

    await expect(validateToleranceJudgmentInputs(input)).rejects.toThrow(MissingDiscrepancyId);
  });

  it('差異IDが undefined のとき、検証に失敗し MissingDiscrepancyId エラーが発生する', async () => {
    const input = {
      discrepancyId: undefined as any,
      judgmentResult: 'within_tolerance',
      judgmentReason: '判定根拠の説明',
    };

    await expect(validateToleranceJudgmentInputs(input)).rejects.toThrow(MissingDiscrepancyId);
  });

  it('差異IDが空文字列のとき、検証に失敗し MissingDiscrepancyId エラーが発生する', async () => {
    const input = {
      discrepancyId: '',
      judgmentResult: 'within_tolerance',
      judgmentReason: '判定根拠の説明',
    };

    await expect(validateToleranceJudgmentInputs(input)).rejects.toThrow(MissingDiscrepancyId);
  });
});
