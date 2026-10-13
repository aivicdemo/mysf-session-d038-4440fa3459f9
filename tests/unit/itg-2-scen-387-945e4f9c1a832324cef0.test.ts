import { classifyGapsAndScore } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput } from '../../src/logic/gap-classification-engine';

describe('SCEN-387: ギャップが非対応に分類される', () => {
  it('承認者代理設定機能が標準機能では実現不可のため、スコア90以上100以下で返される', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: JSON.parse(
        '{"functionName":"請求書承認フロー","description":"請求書作成後、営業部長→財務部長の順序で承認を得るフロー。各承認ステップで金額に応じた承認権限チェックを実施。","implementationMethod":"Salesforce Process Builder + Approval Process","constraints":["承認者の代理設定に対応","却下時は作成者に差し戻し","承認完了後は請求書ステータスが『承認済み』に変更"]}'
      ),
      standardFunctionality: JSON.parse(
        '{"functionName":"請求書承認フロー","description":"移行対象システムで提供される標準承認機能。複数段階の承認ルーティングと権限ベースの判定をサポート。","provisionMethod":"標準ワークフロー・エンジン","constraints":["承認者代理のサポート状況: 部分的（事前登録のみ）","却下時の処理: 差し戻し可能","ステータス自動更新: 承認完了時に『承認済み』に変更"]}'
      ),
      gapClassificationCriteria: JSON.parse(
        '{"完全対応":{"definition":"既存機能の全要件が標準機能で実装可能で、制約条件に矛盾なし","ruleLogic":"実装方式と提供方式の機能要素が全て対応し、制約条件の全項目が実現可能"},"部分対応":{"definition":"既存機能の大部分が標準で対応するが、一部の制約条件で代替実装が必要","ruleLogic":"実装方式の80%以上が提供方式で対応するが、制約条件の一部が限定的"},"カスタマイズ必要":{"definition":"既存機能の機能要件は対応するが、制約条件の実装には標準機能の拡張が不可欠","ruleLogic":"基本的な機能は満たすが、制約条件の重要要件が提供方式では実現不可"},"非対応":{"definition":"既存機能の中核要件が標準機能では実現不可、または根本的な技術的矛盾あり","ruleLogic":"実装方式の50%未満が提供方式でサポートされるか、技術的な実現不可能性が存在"}}'
      ),
      scoringParameters: JSON.parse(
        '{"baseGapScore":0,"implementationMethodCoverageWeight":0.4,"constraintComplianceWeight":0.35,"implementationEffortWeight":0.25,"implementationMethodCoverageScale":{"完全":1,"大部分":0.75,"部分的":0.5,"最小限":0.25,"なし":0},"constraintComplianceScale":{"完全対応":1,"対応":0.8,"部分的対応":0.5,"未対応":0},"implementationEffortScale":{"不要":0,"軽微":10,"中程度":25,"大規模":50,"実現不可":100},"finalScoreFormula":"100 - ((coverage * implementationMethodCoverageWeight + compliance * constraintComplianceWeight + effort * implementationEffortWeight) * 100 / (implementationMethodCoverageWeight + constraintComplianceWeight + implementationEffortWeight))","scoreRange":{"min":0,"max":100},"isValid":true}'
      ),
    };

    const result = await classifyGapsAndScore(input);

    expect(result.gapCategory).toBe('非対応');
    expect(result.gapScore).toBeGreaterThanOrEqual(90);
    expect(result.gapScore).toBeLessThanOrEqual(100);
    expect(result.classificationReason).toContain('承認者代理設定');
    expect(result.classificationReason).toContain('実現不可');
    expect(result.scoringBreakdown).toBeDefined();
    expect(result.recommendedMitigationApproach).toContain(
      'カスタムワークフロー'
    );
  });
});
