import { classifyGapsAndScore } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput } from '../../src/logic/gap-classification-engine';

describe('SCEN-386: ギャップがカスタマイズ必要に分類される', () => {
  it('標準承認プロセスで基本要件は対応可能だが、差し戻し時の自動通知にはカスタマイズが必須で、スコア42が返される', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: JSON.parse(
        '{"functionName":"既存システム請求書承認フロー","description":"請求書作成後、部門長→財務部長の2段階承認を経て確定。承認待ちの請求書は編集不可。","implementationMethod":"カスタムワークフロー","constraints":["承認者は2名固定","承認期限は5営業日","否認時は起案者へ差し戻し"]}'
      ),
      standardFunctionality: JSON.parse(
        '{"functionName":"Salesforce標準承認プロセス","description":"Salesforceの標準承認プロセス機能。段階的な承認ルールを定義可能。","provisionMethod":"標準機能","constraints":["複数段階の承認に対応","承認者ルール、代行者設定が可能","承認期限のカスタマイズ可能"]}'
      ),
      gapClassificationCriteria: JSON.parse(
        '{"completeCoverage":{"description":"既存の全ての機能要件が標準機能でそのまま実装可能な場合","rule":"既存機能の全要件が標準機能の提供方式に含まれ、制約条件に矛盾がない"},"partialCoverage":{"description":"既存機能の主要要件は標準機能で対応できるが、一部の制約条件が異なる場合","rule":"既存機能の70%以上が標準機能で対応可能だが、軽微な追加カスタマイズで対応可能"},"customizationRequired":{"description":"既存機能の主要要件は標準機能で対応できるが、重要な制約条件がカスタマイズ必要な場合","rule":"既存機能の50%以上が標準機能で対応可能だが、業務ロジックの実装にはカスタマイズが必須"},"notCovered":{"description":"既存機能が標準機能では対応不可の場合","rule":"既存機能の50%未満しか標準機能で対応できない、または標準機能に該当する機能がない"}}'
      ),
      scoringParameters: JSON.parse(
        '{"functionalityCoverageWeight":0.4,"constraintCompatibilityWeight":0.35,"customizationComplexityWeight":0.25,"constraintMismatchPenalty":15,"baseGapScore":0,"maxGapScore":100}'
      ),
    };

    const result = await classifyGapsAndScore(input);

    expect(result.gapCategory).toBe('カスタマイズ必要');
    expect(result.gapScore).toBe(42);
    expect(result.classificationReason).toContain('差し戻し時の自動通知ロジック');
    expect(result.classificationReason).toContain('カスタマイズが必須');
    expect(result.scoringBreakdown).toBeDefined();
    expect(result.recommendedMitigationApproach).toContain(
      '標準承認プロセスをベース'
    );
    expect(result.recommendedMitigationApproach).toContain('Salesforceフロー');
  });
});
