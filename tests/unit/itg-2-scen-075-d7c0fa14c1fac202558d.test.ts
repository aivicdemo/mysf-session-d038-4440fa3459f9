import { validateMappingAndClassifyGaps } from '../../src/logic/mapping-validation-service';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import * as authorizationService from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as auditTrailService from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  retrieveMappingDetailsForProject: jest.fn(),
  retrieveMappingDetailsByTargetSystem: jest.fn(),
  saveMappingValidationResult: jest.fn()
}));

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn()
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn()
}));

jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>('../../src/logic/audit-trail-service'),
  recordMappingValidationAuditTrail: jest.fn()
}));

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store')
}));

describe('SCEN-075: 不完全な仕様に対する警告メッセージ生成', () => {
  const projectId = 'proj-001';
  const targetSystemId = 'tsys-oracle-001';
  const userId = 'user-001';
  const sessionId = 'session-valid-001';
  const executionTimestamp = 1704067200000;
  const mappingDetailIds = ['mapping-detail-invoice-001'];

  const userAuthenticationAndRole = {
    isAuthenticated: true,
    userId: 'user-001',
    role: 'mapping_validator',
    hasProjectAccess: true,
    permissions: ['validate_mapping']
  };

  const projectAndSystemContext = {
    projectId: 'proj-001',
    targetSystemId: 'tsys-oracle-001',
    projectStatus: 'active',
    systemStatus: 'configured'
  };

  const mappingDetailsWithStructure = [
    {
      mappingDetailId: 'mapping-detail-invoice-001',
      sfObjectName: 'Invoice__c',
      sfFields: [
        { fieldName: 'Invoice_Number__c', dataType: 'Text', isRequired: true },
        { fieldName: 'Total_Amount__c', dataType: 'Currency', isRequired: true }
      ],
      salesforceSpecification: {
        fieldDefinitions: '不完全。フィールド依存関係が不明確',
        businessLogic: '不明確',
        referenceDetails: '未確認'
      },
      referenceRelationships: [
        {
          relatedObject: 'Opportunity',
          relationshipType: 'lookup',
          description: '未確認'
        }
      ]
    }
  ];

  const targetSystemCapabilities = [
    {
      featureId: 'oracle-invoice-module',
      featureName: 'Invoice Module',
      supportedFields: ['invoice_number', 'amount', 'created_date'],
      calculationCapability: true,
      extensibility: 'limited'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // ユーザー認証・権限の確認
    (authorizationService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(
      userAuthenticationAndRole
    );

    // プロジェクトコンテキストの解決
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(
      projectAndSystemContext
    );

    // マッピング詳細の取得
    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(
      mappingDetailsWithStructure
    );

    // 対象システムの標準機能情報の取得
    (mappingPersistence.retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(
      targetSystemCapabilities
    );

    // 検証結果の保存
    (mappingPersistence.saveMappingValidationResult as jest.Mock).mockResolvedValue({
      validationResultId: 'validation-result-001'
    });

    // 監査ログの記録
    (auditTrailService.recordMappingValidationAuditTrail as jest.Mock).mockResolvedValue({
      auditId: 'audit-001'
    });
  });

  it('既存機能の仕様が不完全な場合、警告メッセージを含む検証結果が生成される', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      sessionId,
      executionTimestamp,
      mappingDetailIds
    };

    const result = await validateMappingAndClassifyGaps(input);

    // 1. 出力の基本構造を確認
    expect(result).toBeDefined();
    expect(result.validationResultId).toBeDefined();
    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);
    expect(result.validationTimestamp).toBe(executionTimestamp);

    // 2. 部分完了ステータスの確認
    expect(result.validationStatus).toBe('part_complete');

    // 3. 分類結果の確認
    expect(result.classificationResults).toBeDefined();
    expect(result.classificationResults.length).toBeGreaterThan(0);

    const classificationResult = result.classificationResults.find(
      r => r.mappingDetailId === 'mapping-detail-invoice-001'
    );
    expect(classificationResult).toBeDefined();

    // 4. 部分対応の分類を確認（gapCategory が partially_mapped）
    expect(classificationResult?.gapCategory).toBe('partially_mapped');

    // または matchingLevel が存在する場合は部分対応を確認
    const matchingLevel = (classificationResult as any)?.matchingLevel;
    if (matchingLevel) {
      expect(matchingLevel).toBe('部分対応');
    }

    // 5. ギャップスコアが55であることを確認
    expect(classificationResult?.gapScore).toBe(55);

    // 6. 推奨アクション（recommendations に含まれるか、または recommendedAction フィールド）
    const recommendedAction = (classificationResult as any)?.recommendedAction;
    if (recommendedAction) {
      expect(recommendedAction).toContain('標準機能で対応');
    } else if (classificationResult?.recommendations) {
      const hasRecommendation = classificationResult.recommendations.some(rec => rec.includes('標準機能で対応'));
      expect(hasRecommendation).toBe(true);
    }

    // 7. リスクフラグの確認（仕様不明確）
    expect(classificationResult?.riskFlag).toBe(true);

    // 8. 全体的なリスクレベルが「中」であることを確認
    expect(result.overallRiskLevel).toBe('中');

    // 9. 推奨事項またはサマリーに警告メッセージが含まれることを確認
    const hasWarningMessage =
      classificationResult?.recommendations?.some(
        rec => rec.includes('仕様の詳細確認が必要です') &&
                rec.includes('経理部門に確認してください')
      ) ||
      result.summaryStatistics &&
      JSON.stringify(result.summaryStatistics).includes('仕様の詳細確認が必要です');

    expect(hasWarningMessage ||
            classificationResult?.detectedIssues?.some(
              issue => issue.includes('仕様の詳細確認が必要です') &&
                       issue.includes('経理部門に確認してください')
            )
    ).toBe(true);

    // 10. 部分対応の分類件数を確認
    expect(result.summaryStatistics.partiallyMappedCount).toBeGreaterThan(0);

    // 11. 検証結果の保存を確認
    expect(mappingPersistence.saveMappingValidationResult).toHaveBeenCalled();

    // 12. 監査ログ記録を確認
    expect(auditTrailService.recordMappingValidationAuditTrail).toHaveBeenCalled();

    // 13. 設計済みエラーが発生していないことを確認
    expect(result).not.toHaveProperty('error');
  });

  it('検証フロー全体において、各ステップが正しく実行されることを確認', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      sessionId,
      executionTimestamp,
      mappingDetailIds
    };

    await validateMappingAndClassifyGaps(input);

    // ユーザー認証が呼ばれたことを確認
    expect(authorizationService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();

    // プロジェクトコンテキスト解決が呼ばれたことを確認
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();

    // マッピング詳細の取得が呼ばれたことを確認
    expect(mappingPersistence.retrieveMappingDetailsForProject).toHaveBeenCalled();

    // 対象システム機能情報の取得が呼ばれたことを確認
    expect(mappingPersistence.retrieveMappingDetailsByTargetSystem).toHaveBeenCalled();

    // 検証結果の保存が呼ばれたことを確認
    expect(mappingPersistence.saveMappingValidationResult).toHaveBeenCalled();

    // 監査ログ記録が呼ばれたことを確認
    expect(auditTrailService.recordMappingValidationAuditTrail).toHaveBeenCalled();
  });

  it('不完全な仕様が検出されると、detectedIssuesに相当する情報が含まれる', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      sessionId,
      executionTimestamp,
      mappingDetailIds
    };

    const result = await validateMappingAndClassifyGaps(input);

    const classificationResult = result.classificationResults.find(
      r => r.mappingDetailId === 'mapping-detail-invoice-001'
    );

    expect(classificationResult?.detectedIssues).toBeDefined();
    expect(classificationResult?.detectedIssues.length).toBeGreaterThan(0);

    // 不完全性に関する問題が検出されているか
    const hasIncompleteSpecIssue = classificationResult?.detectedIssues?.some(
      issue => issue.includes('不完全') ||
               issue.includes('不明確') ||
               issue.includes('未確認')
    );

    expect(hasIncompleteSpecIssue).toBe(true);
  });
});
