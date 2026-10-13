import { classifyGapsAndScore } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput } from '../../src/logic/gap-classification-engine';

describe('SCEN-385: ギャップが部分対応に分類される', () => {
  it('基本的な計算ロジックは実装可能だが複雑な条件に制限があり、スコアが0より大きく100未満で返される', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: JSON.parse(
        '{"functionName":"既存システムの請求明細計算","description":"取引先の信用限度額に基づいて請求明細の割引率を自動計算","implementationMethod":"カスタムロジック実装","constraints":["信用限度額が100万円以上の場合、割引率5%を適用","信用限度額が50万円以上100万円未満の場合、割引率3%を適用","信用限度額が50万円未満の場合、割引率なし"],"supportedDataTypes":["Number","Text"],"requiredFields":["accountCreditLimit","lineItemAmount"]}'
      ),
      standardFunctionality: JSON.parse(
        '{"functionName":"Salesforce標準機能：計算項目とロールアップ集計","description":"参照フィールドを通じた親オブジェクトの値に基づく条件付き計算","provisionMethod":"標準計算項目フィールド","constraints":["計算項目は最大125文字までの数式をサポート","参照関係を1段階までサポート","IF関数による条件分岐は3段階まで","ロールアップ集計はSUM、COUNT、MAX、MINに限定"],"supportedDataTypes":["Number","Text","Currency"],"availableFeatures":["IF条件分岐","参照フィールド参照","数値計算"]}'
      ),
      gapClassificationCriteria: JSON.parse(
        '{"completeMatch":{"description":"既存機能と標準機能がすべての要件を満たす場合","rule":"すべての制約条件が標準機能で実装可能で、パフォーマンス要件も満たす"},"partialMatch":{"description":"既存機能の大部分が標準機能で実装可能だが、一部機能に制限がある場合","rule":"基本的な計算ロジックは実装できるが、複雑な条件分岐または参照段階数が制限される"},"customizationRequired":{"description":"標準機能では不足で、カスタマイズが必要な場合","rule":"数式の複雑さが標準機能の限界を超える、またはカスタム開発が必須"},"notSupported":{"description":"標準機能では全く対応できない場合","rule":"根本的な技術的制限により実装不可能"}}'
      ),
      scoringParameters: JSON.parse(
        '{"completenessWeight":0.4,"constraintAlignmentWeight":0.35,"dataTypeCompatibilityWeight":0.15,"performanceImpactWeight":0.1,"maxScore":100,"minScore":0,"scoringFormula":"sum(各要素のweightedScore) / 100"}'
      ),
    };

    const result = await classifyGapsAndScore(input);

    expect(result.gapCategory).toBe('部分対応');
    expect(result.gapScore).toBeGreaterThan(0);
    expect(result.gapScore).toBeLessThan(100);
    expect(result.gapScore).toBeGreaterThanOrEqual(65);
    expect(result.gapScore).toBeLessThanOrEqual(75);
    expect(result.classificationReason).toContain('基本的な割引計算ロジック');
    expect(result.scoringBreakdown).toBeDefined();
    expect(result.recommendedMitigationApproach).toContain(
      '標準計算項目で基本的な割引ロジック'
    );
  });
});
