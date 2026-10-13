import { classifyGapsAndScore } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput } from '../../src/logic/gap-classification-engine';

describe('SCEN-384: ギャップが完全対応に分類される', () => {
  it('既存機能と標準機能が完全に一致し、スコアが0に近い値で返される', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: JSON.parse(
        '{"functionName":"既存システム請求書発行機能","description":"商談単位で請求書を自動生成し、税計算と請求明細の集計を実行","implementationMethod":"Salesforce カスタムオブジェクト（請求書__c、請求明細__c）とApexトリガー","constraints":["請求書作成後の編集は不可","請求明細は行単位で税率を指定可能","金額計算は小数点第2位で四捨五入"]}'
      ),
      standardFunctionality: JSON.parse(
        '{"functionName":"移行対象システム標準請求機能","description":"商談単位で請求書を発行し、請求明細の税計算と集計を提供","provisionMethod":"標準モジュール「Billing」の請求書テーブル","constraints":["請求書作成後の編集は不可","請求明細は行単位で税率を指定可能","金額計算は小数点第2位で四捨五入"]}'
      ),
      gapClassificationCriteria: JSON.parse(
        '{"completeAlignment":{"condition":"既存機能と標準機能の機能名、説明、制約条件がすべて一致する場合","categoryName":"完全対応"},"partialAlignment":{"condition":"既存機能の70%以上が標準機能でカバーされているが、制約条件に軽微な差異がある場合","categoryName":"部分対応"},"customizationRequired":{"condition":"既存機能の50%～70%が標準機能でカバーされており、カスタマイズにより対応可能な場合","categoryName":"カスタマイズ必要"},"notAligned":{"condition":"既存機能の50%未満しか標準機能でカバーされていない場合","categoryName":"非対応"}}'
      ),
      scoringParameters: JSON.parse(
        '{"weightings":{"description":0.3,"provisionMethod":0.25,"constraints":0.45},"calculationFormula":"(1 - alignmentRatio) × 100","alignmentRatio":"一致した属性数 / 総属性数","scoreRangeMin":0,"scoreRangeMax":100}'
      ),
    };

    const result = await classifyGapsAndScore(input);

    expect(result.gapCategory).toBe('完全対応');
    expect(result.gapScore).toBeGreaterThanOrEqual(0);
    expect(result.gapScore).toBeLessThanOrEqual(5);
    expect(result.classificationReason).toContain('完全対応');
    expect(result.scoringBreakdown).toBeDefined();
    expect(result.recommendedMitigationApproach).toContain('標準機能をそのまま採用可能');
  });
});
