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

describe('SCEN-085: assessMigrationRisksFromMapping - Normal Case with Gaps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully assess migration risks and return complete evaluation result', async () => {
    const projectId = 'proj-sf-migration-001';
    const targetSystemId = 'target-system-oracle-001';
    const userId = 'user-001';
    const evaluationDateTime = new Date('2026-02-15T10:30:00Z');

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'FUNCTIONAL_GAP',
        gapScore: 35,
        validationStatus: 'VALIDATED',
        detectedIssues: ['請求書の承認フロー機能が移行対象システムで標準機能なし'],
        recommendations: ['カスタム承認フローの実装が必要'],
        riskLevel: 'MEDIUM',
      },
      {
        mappingDetailId: 'map-002',
        existingFunctionName: 'Invoice_Line__c',
        gapCategory: 'CALCULATION_GAP',
        gapScore: 28,
        validationStatus: 'VALIDATED',
        detectedIssues: ['請求明細の計算項目（税金計算）が部分的にしか対応しない'],
        recommendations: ['計算ロジックのカスタマイズが必要'],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Total_Tax_Amount__c',
        logicType: 'FORMULA',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: ['calc-dep-1', 'calc-dep-2', 'calc-dep-3'],
        referencedFieldCount: 3,
        migrationRisk: 'HIGH',
      },
      {
        calculationLogicId: 'calc-002',
        logicName: 'Line_Discount_Calculation__c',
        logicType: 'WORKFLOW',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: ['calc-dep-1', 'calc-dep-2'],
        referencedFieldCount: 2,
        migrationRisk: 'MEDIUM',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'AccountId',
        cardinality: 'MANY_TO_ONE',
        isRequired: false,
        deleteAction: 'CLEAR_FIELD',
        isPartOfCircularDependency: false,
      },
      {
        referenceRelationshipId: 'ref-002',
        sourceObjectName: 'Invoice_Line__c',
        targetObjectName: 'Invoice__c',
        referenceFieldName: 'InvoiceId',
        cardinality: 'MANY_TO_ONE',
        isRequired: true,
        deleteAction: 'CASCADE_DELETE',
        isPartOfCircularDependency: false,
      },
      {
        referenceRelationshipId: 'ref-003',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Opportunity',
        referenceFieldName: 'OpportunityId',
        cardinality: 'MANY_TO_ONE',
        isRequired: false,
        deleteAction: 'CLEAR_FIELD',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'ApprovalWorkflow',
        functionCategory: 'WORKFLOW',
        complexityLevel: 50,
        isMappingTarget: false,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-002',
        functionName: 'CalculatedFields',
        functionCategory: 'CALCULATION',
        complexityLevel: 25,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-003',
        functionName: 'CustomReporting',
        functionCategory: 'REPORTING',
        complexityLevel: 75,
        isMappingTarget: false,
        dependentCapabilityIds: [],
      },
    ];

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      operationType: 'assess_migration_risks',
      projectId: projectId,
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: projectId,
      targetSystemId: targetSystemId,
      userId: userId,
      userRole: 'MigrationManager',
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
      summary: { totalObjectsValidated: 3, successCount: 3, errorCount: 0, totalErrorsDetected: 0 },
    });

    (dataValidationRules.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 3, successCount: 3, errorCount: 0, totalErrorsDetected: 0 },
    });

    const riskAssessmentId = 'risk-assessment-20260215-001';
    (mappingPersistence.saveMigrationRiskAssessment as jest.Mock).mockResolvedValue({
      riskAssessmentId: riskAssessmentId,
      projectId: projectId,
      riskClassification: 'FUNCTIONAL_GAP',
      riskItemName: 'Invoice承認フロー',
      occurrencePossibilityLevel: 'HIGH',
      impactLevel: 'HIGH',
      riskEvaluationScore: 72,
      remediationApproach: 'カスタム承認ロジック実装',
    });

    (auditTrailService.recordRiskAssessmentAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-trail-20260215-001',
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
    expect(result.riskFactors.length).toBeGreaterThanOrEqual(2);
    expect(result.overallRiskScore).toBeDefined();
    expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallRiskScore).toBeLessThanOrEqual(100);
    expect(result.overallRiskLevel).toBeDefined();
    expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.overallRiskLevel);
    expect(result.mitigationStrategies).toBeDefined();
    expect(result.mitigationStrategies.length).toBeGreaterThanOrEqual(2);
    expect(result.dependencyRisks).toBeDefined();
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
