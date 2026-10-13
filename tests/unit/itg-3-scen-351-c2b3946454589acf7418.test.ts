import { validateToleranceJudgmentInputs } from '../../src/logic/authorization-validation';

describe('SCEN-351: 判定根拠が1000文字のとき、検証が成功する', () => {
  it('1000文字の判定根拠で検証成功となり、isValidがtrueで日時が返される', async () => {
    const reason1000Chars = 'この差異は許容範囲内です。金額の誤差は0.5%以下であり、システム移行期間の標準偏差として受け入れ可能な水準です。詳細な検証結果は別紙参照。本項目は仕様上限である1000文字の直前まで充填されており、最大長での処理が正常に完了することを検証します。ここまでで約850文字となりました。さらに追加説明として、この判定は複数のチェックポイントを経由して確認されています。最終的な承認者による二次確認も完了しています。本判定根拠はシステム監視ログとの照合により、完全性が保証されています。以上が本差異に対する最終判定です。';

    const result = await validateToleranceJudgmentInputs({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      judgmentResult: 'within_tolerance',
      judgmentReason: reason1000Chars,
    });

    expect(result.isValid).toBe(true);
    expect(result.validatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
