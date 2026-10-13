import { describe, it, expect } from '@jest/globals';
import { classifyGapsAndScore } from '../../src/logic/gap-classification-engine';
import type { ClassifyGapsAndScoreInput } from '../../src/logic/gap-classification-engine';

describe('SCEN-394: ギャップ分類の判定理由が根拠とともに明確に記述される', () => {
  it('should return classificationReason with clear justification and scoring breakdown details', async () => {
    const input: ClassifyGapsAndScoreInput = {
      existingFunctionality: {
        functionName: '請求書承認フロー',
        functionDescription: '請求書作成後、営業部長→財務部長の2段階承認で実行。承認者が却下した場合は作成者に戻す。',
        implementationMethod: 'Salesforce Process Builder',
        constraints: ['承認待ち中は請求書の金額変更不可', '却下から24時間以内に再申請可能', '承認期限は申請から5営業日'],
      },
      standardFunctionality: {
        functionName: 'Oracle承認フロー標準機能',
        functionDescription: '承認プロセスは複数ステップ対応。各ステップで承認者を指定でき、却下時は自動でステップ1に戻す。',
        provisionMethod: 'Oracle Workflow Engine (標準提供)',
        constraints: ['承認待ち中は一部フィールド（金額）の変更を制御可能', '却下から再申請までの時間制限なし', '承認期限はカスタマイズで設定可能'],
      },
      gapClassificationCriteria: {
        completeCoverageThreshold: {
          description: '既存機能の要件がすべて標準機能で満たされる場合',
          rules: ['主要な業務フロー（承認段数、却下時の動作、承認待ちでの制限）が完全に一致', '制約条件がすべて実装可能', '追加のカスタマイズなしで運用可能'],
        },
        partialCoverageThreshold: {
          description: '既存機能の主要要件は満たすが、一部の制約条件に差がある場合',
          rules: ['承認フロー基本機能は実装可能だが、期限管理やリセット条件に細かい差がある', '標準機能で70%以上の要件を満たす'],
        },
        customizationRequiredThreshold: {
          description: '標準機能の基本をベースに、カスタマイズで既存機能を実現する場合',
          rules: ['承認ステップ自体は標準だが、却下時のリセット条件をカスタマイズが必要', '承認期限の強制や再申請制限などをカスタムロジックで追加', '標準機能で30～70%の要件を満たす'],
        },
        nonCoverageThreshold: {
          description: '標準機能では実現が困難または不可能な場合',
          rules: ['基本的な承認フロー自体が標準機能にない', '標準機能で30%未満の要件を満たす'],
        },
      } as any,
      scoringParameters: {
        functionalityGapWeight: 0.4,
        performanceGapWeight: 0.3,
        constraintGapWeight: 0.2,
        customizationComplexityWeight: 0.1,
        scoringFormula: 'gapScore = 100 - ((85 × 0.4) + (67 × 0.3) + (60 × 0.2) + (75 × 0.1))',
        maxScore: 100,
      },
    };

    const result = await classifyGapsAndScore(input);

    expect(result).toBeDefined();
    expect(result.classificationReason).toBeDefined();
    expect(result.classificationReason.length).toBeGreaterThan(0);

    expect(result.classificationReason).toMatch(/部分対応/);
    expect(result.classificationReason).toMatch(/Salesforce|Oracle/);
    expect(result.classificationReason).toMatch(/標準機能/);

    expect(result.scoringBreakdown).toBeDefined();
    expect(result.scoringBreakdown.calculationDetails).toBeDefined();

    expect(result.recommendedMitigationApproach).toBeDefined();
    expect(result.recommendedMitigationApproach.length).toBeGreaterThan(0);
  });
});
