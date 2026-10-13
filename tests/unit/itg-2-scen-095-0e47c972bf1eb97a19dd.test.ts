import { assessMigrationRisksFromMapping } from '../../src/logic/risk-assessment-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';
import * as persistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';
import type {
  AssessMigrationRisksFromMappingInput,
  AssessMigrationRisksFromMappingOutput,
  CalculationLogicMetadata,
  MappingValidationResult,
  ObjectReferenceMetadata,
  TargetSystemCapability,
} from '../../src/logic/risk-assessment-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-095: 計算ロジックの依存関係が複雑である場合、dependencyRisksにリスク要因が含まれて返される', () => {
  const projectId = 'proj-001';
  const targetSystemId = 'target-sys-oracle';
  const userId = 'user-pm-001';
  const evaluationDateTime = new Date('2024-01-15T10:30:00Z');

  const calculationLogicMetadata: CalculationLogicMetadata[] = [
    {
      calculationLogicId: 'calc-001',
      logicName: '請求書合計金額計算',
      logicType: 'calculation',
      migrationDifficulty: 'high',
      dependentLogicIds: ['detail-amount-calc', 'tax-calc', 'discount-calc', 'surcharge-calc', 'currency-conversion'],
      referencedFieldCount: 5,
      migrationRisk: 'high' as const,
    },
    {
      calculationLogicId: 'calc-002',
      logicName: '請求明細小計計算',
      logicType: 'calculation',
      migrationDifficulty: 'high',
      dependentLogicIds: ['unit-price-lookup', 'quantity-validation', 'tax-rate-determination'],
      referencedFieldCount: 3,
      migrationRisk: 'high' as const,
    },
  ];

  const mappingValidationResults: MappingValidationResult[] = [
    {
      mappingDetailId: 'gap-001',
      existingFunctionName: 'Salesforce計算項目__c',
      gapCategory: 'calculation-logic-gap',
      gapScore: 8.5,
      validationStatus: 'gap-detected',
      detectedIssues: ['複雑な依存関係を持つ計算ロジックの移行'],
      recommendations: ['段階的実装'],
      riskLevel: 'high',
    },
  ];

  const objectReferenceMetadata: ObjectReferenceMetadata[] = [
    {
      referenceRelationshipId: 'ref-001',
      sourceObjectName: 'Invoice__c',
      targetObjectName: 'InvoiceDetail__c',
      referenceFieldName: 'invoice_ref',
      cardinality: 'one-to-many',
      isRequired: true,
      deleteAction: 'cascade',
      isPartOfCircularDependency: false,
    },
  ];

  const targetSystemCapabilities: TargetSystemCapability[] = [
    {
      capabilityId: 'cap-001',
      functionName: '計算ロジック実装',
      functionCategory: 'calculation',
      complexityLevel: 40,
      isMappingTarget: true,
      dependentCapabilityIds: [],
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      userId: 'user-pm-001',
      userRole: 'project-manager',
      hasPermission: true,
      permissionType: 'feature-mapping-execute',
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-001',
      targetSystemId: 'target-sys-oracle',
      projectStatus: 'active',
      userHasAccess: true,
    });

    (validationModule.validateCalculationLogicDefinitions as jest.Mock).mockResolvedValue({
      isValid: true,
      validationErrors: [],
    });

    (validationModule.validateObjectReferenceRelationships as jest.Mock).mockResolvedValue({
      isValid: true,
      validationErrors: [],
    });

    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
      validationErrors: [],
    });

    (persistenceModule.saveMigrationRiskAssessment as jest.Mock).mockResolvedValue({
      riskAssessmentId: 'risk-assess-20240115-001',
      saved: true,
    });

    (auditModule.recordRiskAssessmentAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-20240115-001',
      recorded: true,
    });
  });

  it('依存関係が複雑な計算ロジックのリスク要因が評価される', async () => {
    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      calculationLogicMetadata,
      mappingValidationResults,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    const result = await assessMigrationRisksFromMapping(input);

    // 1. riskAssessmentId が期待値である
    expect(result.riskAssessmentId).toBe('risk-assess-20240115-001');

    // 2. projectId が入力値と一致
    expect(result.projectId).toBe('proj-001');

    // 3. targetSystemId が入力値と一致
    expect(result.targetSystemId).toBe('target-sys-oracle');

    // 4. dependencyRisks 配列が空でなく、1 件以上の DependencyRisk 要素を含む
    expect(result.dependencyRisks).toBeDefined();
    expect(Array.isArray(result.dependencyRisks)).toBe(true);
    expect(result.dependencyRisks.length).toBeGreaterThan(0);

    // 5. dependencyRisks 配列の各要素が必要な情報を持つ
    result.dependencyRisks.forEach((risk) => {
      expect(risk).toHaveProperty('dependencyRiskId');
      expect(risk).toHaveProperty('dependencyType');
      expect(risk).toHaveProperty('sourceElement');
      expect(risk).toHaveProperty('targetElement');
      expect(risk).toHaveProperty('riskDescription');
      expect(risk).toHaveProperty('riskLevel');
      expect(risk).toHaveProperty('isCircularDependency');
    });

    // 6. riskFactors 配列にも依存関係由来のリスク要因が含まれる
    expect(result.riskFactors).toBeDefined();
    expect(Array.isArray(result.riskFactors)).toBe(true);
    expect(result.riskFactors.length).toBeGreaterThan(0);

    // 7. overallRiskScore が 50 以上の値である
    expect(result.overallRiskScore).toBeGreaterThanOrEqual(50);
    expect(result.overallRiskScore).toBeLessThanOrEqual(100);

    // 8. overallRiskLevel が '中' または '高' または '極高' のいずれかである
    expect(['中', '高', '極高']).toContain(result.overallRiskLevel);

    // 9. mitigationStrategies 配列に計算ロジック依存関係のリスク低減対策を含む
    expect(result.mitigationStrategies).toBeDefined();
    expect(Array.isArray(result.mitigationStrategies)).toBe(true);
    expect(result.mitigationStrategies.length).toBeGreaterThan(0);

    // 10. evaluationDateTime が期待値である
    expect(result.evaluationDateTime).toEqual(evaluationDateTime);

    // 11. evaluatedByUserId が期待値である
    expect(result.evaluatedByUserId).toBe('user-pm-001');
  });

  it('高複雑度の計算ロジックの依存関係から高確率と高影響度のリスク要因が検出される', async () => {
    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      calculationLogicMetadata,
      mappingValidationResults,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    const result = await assessMigrationRisksFromMapping(input);

    // dependencyRisks に高い確率と影響度のリスク要因が含まれることを確認
    const highRisks = result.dependencyRisks.filter(risk =>
      risk.riskLevel === '高' || risk.riskLevel === '極高'
    );
    expect(highRisks.length).toBeGreaterThan(0);
  });

  it('複雑な依存チェーンのリスク評価が実行される', async () => {
    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      calculationLogicMetadata,
      mappingValidationResults,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    const result = await assessMigrationRisksFromMapping(input);

    // 複雑度が high で依存関係が 5 個以上の calc-001 に対するリスク要因が存在
    const calc001Risks = result.dependencyRisks.filter(risk =>
      risk.sourceElement.includes('calc-001') || risk.sourceElement.includes('請求書合計金額計算')
    );
    expect(calc001Risks.length).toBeGreaterThan(0);
  });

  it('verifyUserAuthenticationAndAuthorization が呼び出され、ユーザーの認証と権限が検証される', async () => {
    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      calculationLogicMetadata,
      mappingValidationResults,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    await assessMigrationRisksFromMapping(input);

    expect(authModule.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
  });

  it('resolveProjectContext が呼び出され、プロジェクトコンテキストが確定される', async () => {
    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      calculationLogicMetadata,
      mappingValidationResults,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    await assessMigrationRisksFromMapping(input);

    expect(projectContextModule.resolveProjectContext).toHaveBeenCalled();
  });

  it('validateCalculationLogicDefinitions が呼び出され、計算ロジック定義のバリデーションが実行される', async () => {
    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      calculationLogicMetadata,
      mappingValidationResults,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    await assessMigrationRisksFromMapping(input);

    expect(validationModule.validateCalculationLogicDefinitions).toHaveBeenCalled();
  });

  it('validateObjectReferenceRelationships が呼び出され、オブジェクト参照関係のバリデーションが実行される', async () => {
    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      calculationLogicMetadata,
      mappingValidationResults,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    await assessMigrationRisksFromMapping(input);

    expect(validationModule.validateObjectReferenceRelationships).toHaveBeenCalled();
  });

  it('validateStandardFunctionMappings が呼び出され、対象システム機能マッピングのバリデーションが実行される', async () => {
    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      calculationLogicMetadata,
      mappingValidationResults,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    await assessMigrationRisksFromMapping(input);

    expect(validationModule.validateStandardFunctionMappings).toHaveBeenCalled();
  });

  it('saveMigrationRiskAssessment が呼び出され、リスク評価結果が保存される', async () => {
    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      calculationLogicMetadata,
      mappingValidationResults,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    await assessMigrationRisksFromMapping(input);

    expect(persistenceModule.saveMigrationRiskAssessment).toHaveBeenCalled();
  });

  it('recordRiskAssessmentAuditTrail が呼び出され、監査証跡が記録される', async () => {
    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      calculationLogicMetadata,
      mappingValidationResults,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    await assessMigrationRisksFromMapping(input);

    expect(auditModule.recordRiskAssessmentAuditTrail).toHaveBeenCalled();
  });
});
