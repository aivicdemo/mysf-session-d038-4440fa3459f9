import { assessMigrationRisksFromMapping } from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as dataValidationRules from '../../src/logic/data-validation-rules';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import * as auditTrailService from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-094: assessMigrationRisksFromMapping - Detailed Risk Factors and Mitigation Strategies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return comprehensive risk assessment with detailed riskFactors and mitigationStrategies', async () => {
    const projectId = 'proj-20240115-migration-001';
    const targetSystemId = 'oracle-erp-system-01';
    const userId = 'user-12345-migration-lead';
    const evaluationDateTime = new Date('2024-01-15T10:30:00Z');

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-invoice-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'FUNCTIONAL_GAP',
        gapScore: 65,
        validationStatus: 'VALIDATED',
        detectedIssues: ['請求書オブジェクトの承認フロー機能が移行対象システムに標準装備されていない'],
        recommendations: ['カスタム承認ロジックをワークフローで実装'],
        riskLevel: 'HIGH',
      },
      {
        mappingDetailId: 'map-invoice-detail-002',
        existingFunctionName: 'Invoice_Line__c',
        gapCategory: 'CALCULATION_GAP',
        gapScore: 45,
        validationStatus: 'VALIDATED',
        detectedIssues: ['請求明細の動的な割引計算ロジックが完全には対応していない'],
        recommendations: ['計算ロジックをバッチ処理で別途実装'],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-discount-001',
        logicName: 'Invoice_Line割引計算',
        logicType: 'FORMULA',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: ['Account', 'Pricebook2'],
        referencedFieldCount: 2,
        migrationRisk: 'HIGH',
      },
      {
        calculationLogicId: 'calc-tax-002',
        logicName: 'Invoice税金計算',
        logicType: 'WORKFLOW',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: ['Invoice_Line__c'],
        referencedFieldCount: 1,
        migrationRisk: 'MEDIUM',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-account-invoice-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'AccountId',
        cardinality: 'MANY_TO_ONE',
        isRequired: false,
        deleteAction: 'CLEAR_FIELD',
        isPartOfCircularDependency: false,
      },
      {
        referenceRelationshipId: 'ref-invoice-line-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Invoice_Line__c',
        referenceFieldName: 'InvoiceLineId',
        cardinality: 'ONE_TO_MANY',
        isRequired: false,
        deleteAction: 'CLEAR_FIELD',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-approval-workflow',
        functionName: '承認フロー機能',
        functionCategory: 'WORKFLOW',
        complexityLevel: 70,
        isMappingTarget: false,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-tax-calculation',
        functionName: '税金計算',
        functionCategory: 'CALCULATION',
        complexityLevel: 25,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: userId,
      operationType: 'assess_migration_risks',
      projectId: projectId,
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: projectId,
      targetSystemId: targetSystemId,
      userId: userId,
      userRole: 'migration_lead',
      isContextValid: true,
    });

    (dataValidationRules.validateCalculationLogicDefinitions as jest.Mock).mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 2, successCount: 2, errorCount: 0, totalErrorsDetected: 0 },
    });

    (dataValidationRules.validateObjectReferenceRelationships as jest.Mock).mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 2, successCount: 2, errorCount: 0, totalErrorsDetected: 0 },
    });

    (dataValidationRules.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 2, successCount: 2, errorCount: 0, totalErrorsDetected: 0 },
    });

    const riskAssessmentId = 'risk-assess-20240115-001';
    (mappingPersistence.saveMigrationRiskAssessment as jest.Mock).mockResolvedValue({
      riskAssessmentId: riskAssessmentId,
      projectId: projectId,
      riskClassification: 'MULTIPLE',
      riskItemName: 'Multiple Migration Risks',
      occurrencePossibilityLevel: 'MEDIUM',
      impactLevel: 'HIGH',
      riskEvaluationScore: 52,
      remediationApproach: 'Comprehensive mitigation strategy',
    });

    (auditTrailService.recordRiskAssessmentAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-trail-20240115-001',
      userId: userId,
      projectId: projectId,
      operationType: 'assess_migration_risks',
      operationStatus: 'SUCCESS',
      operationExecutedAt: evaluationDateTime,
    });

    const result = await assessMigrationRisksFromMapping({
      projectId,
      targetSystemId,
      mappingValidationResults,
      calculationLogicMetadata,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    });

    expect(result).toBeDefined();
    expect(result.riskAssessmentId).toBe(riskAssessmentId);
    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);

    expect(result.riskFactors).toBeDefined();
    expect(Array.isArray(result.riskFactors)).toBe(true);
    expect(result.riskFactors.length).toBeGreaterThanOrEqual(2);

    result.riskFactors.forEach((factor) => {
      expect(factor.riskFactorId).toBeDefined();
      expect(factor.riskClassification).toBeDefined();
      expect(['FUNCTIONAL_GAP', 'CALCULATION_GAP', 'DEPENDENCY_RISK']).toContain(factor.riskClassification);
      expect(factor.riskItemName).toBeDefined();
      expect(factor.riskDescription).toBeDefined();
      expect(factor.probabilityLevel).toBeDefined();
      expect(factor.impactLevel).toBeDefined();
      expect(factor.riskScore).toBeGreaterThanOrEqual(0);
      expect(factor.riskScore).toBeLessThanOrEqual(100);
    });

    expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallRiskScore).toBeLessThanOrEqual(100);

    expect(result.overallRiskLevel).toBeDefined();
    expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.overallRiskLevel);

    expect(result.mitigationStrategies).toBeDefined();
    expect(Array.isArray(result.mitigationStrategies)).toBe(true);
    expect(result.mitigationStrategies.length).toBeGreaterThanOrEqual(result.riskFactors.length);

    result.mitigationStrategies.forEach((strategy) => {
      expect(strategy.strategyId).toBeDefined();
      expect(strategy.targetRiskFactorId).toBeDefined();
      expect(strategy.mitigationApproach).toBeDefined();
      expect(strategy.mitigationActions).toBeDefined();
      expect(Array.isArray(strategy.mitigationActions)).toBe(true);
      expect(strategy.expectedEffectiveness).toBeDefined();
      expect(strategy.estimatedEffort).toBeDefined();
    });

    expect(result.dependencyRisks).toBeDefined();
    expect(Array.isArray(result.dependencyRisks)).toBe(true);

    result.dependencyRisks.forEach((depRisk) => {
      expect(depRisk.dependencyRiskId).toBeDefined();
      expect(depRisk.dependencyType).toBeDefined();
      expect(depRisk.sourceElement).toBeDefined();
      expect(depRisk.targetElement).toBeDefined();
      expect(depRisk.riskDescription).toBeDefined();
      expect(depRisk.riskLevel).toBeDefined();
      expect(typeof depRisk.isCircularDependency).toBe('boolean');
    });

    expect(result.evaluationDateTime).toEqual(evaluationDateTime);
    expect(result.evaluatedByUserId).toBe(userId);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();
    expect(dataValidationRules.validateCalculationLogicDefinitions).toHaveBeenCalled();
    expect(dataValidationRules.validateObjectReferenceRelationships).toHaveBeenCalled();
    expect(dataValidationRules.validateStandardFunctionMappings).toHaveBeenCalled();
    expect(mappingPersistence.saveMigrationRiskAssessment).toHaveBeenCalled();
    expect(auditTrailService.recordRiskAssessmentAuditTrail).toHaveBeenCalled();
  });
});
