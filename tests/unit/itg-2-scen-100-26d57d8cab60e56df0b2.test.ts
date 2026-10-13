import {
  assessMigrationRisksFromMapping,
  AssessMigrationRisksFromMappingInput,
} from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';
import * as persistenceService from '../../src/logic/mapping-persistence';
import * as auditService from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-100: リスク評価の実行日時とユーザーIDが評価結果に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('evaluationDateTimeとevaluatedByUserIdが出力に記録される', async () => {
    const projectId = 'proj-salesforce-migration-2024';
    const targetSystemId = 'target-oracle-erp-001';
    const userId = 'user-pm-12345';
    const evaluationDateTime = new Date('2024-11-15T14:30:45.000Z');

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-invoice-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'CRITICAL',
        gapScore: 85,
        validationStatus: 'DETECTED',
        detectedIssues: ['Missing critical fields'],
        recommendations: ['カスタマイズ実装が必須'],
        riskLevel: 'CRITICAL',
      },
      {
        mappingDetailId: 'map-invoice-line-001',
        existingFunctionName: 'InvoiceLine__c',
        gapCategory: 'HIGH',
        gapScore: 72,
        validationStatus: 'DETECTED',
        detectedIssues: ['Fields differ'],
        recommendations: ['標準機能の拡張が必要'],
        riskLevel: 'HIGH',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-tax-001',
        logicName: 'Tax Calculation',
        logicType: 'FORMULA_FIELD',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: ['field1', 'field2', 'field3'],
        referencedFieldCount: 3,
        migrationRisk: 'MEDIUM',
      },
      {
        calculationLogicId: 'calc-discount-001',
        logicName: 'Discount Calculation',
        logicType: 'PROCESS_BUILDER',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: ['f1', 'f2', 'f3', 'f4', 'f5'],
        referencedFieldCount: 5,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-inv-acc-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'Account',
        cardinality: 'N:1',
        isRequired: false,
        deleteAction: 'RESTRICT',
        isPartOfCircularDependency: false,
      },
      {
        referenceRelationshipId: 'ref-invline-inv-001',
        sourceObjectName: 'InvoiceLine__c',
        targetObjectName: 'Invoice__c',
        referenceFieldName: 'Invoice',
        cardinality: 'N:1',
        isRequired: true,
        deleteAction: 'CASCADE',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-invoice-standard',
        functionName: '標準請求機能',
        functionCategory: 'BILLING',
        complexityLevel: 20,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-tax-calculation',
        functionName: '税計算ロジック',
        functionCategory: 'FINANCE',
        complexityLevel: 30,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    const input: AssessMigrationRisksFromMappingInput = {
      projectId,
      targetSystemId,
      mappingValidationResults,
      calculationLogicMetadata,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime,
      userId,
    };

    jest.mocked(authService.verifyUserAuthenticationAndAuthorization).mockResolvedValue({
      isAuthorized: true,
      userId,
      operationType: 'ASSESS_MIGRATION_RISKS',
      projectId,
    });

    jest.mocked(projectContextService.resolveProjectContext).mockResolvedValue({
      projectId,
      targetSystemId,
      userId,
      userRole: 'PROJECT_MANAGER',
      isContextValid: true,
    });

    jest.mocked(persistenceService.saveMigrationRiskAssessment).mockResolvedValue({
      riskAssessmentId: 'risk-assess-001',
      projectId,
      riskClassification: 'OVERALL',
      riskItemName: 'Migration Risk Assessment',
      riskDescription: 'Overall assessment',
      occurrencePossibilityLevel: 'HIGH',
      impactLevel: 'HIGH',
      riskEvaluationScore: 78,
      remediationApproach: 'Comprehensive approach',
      assessorId: userId,
      assessmentTimestamp: evaluationDateTime.toISOString(),
      createdAt: evaluationDateTime.toISOString(),
      createdBy: userId,
      updatedAt: evaluationDateTime.toISOString(),
      updatedBy: userId,
    });

    jest.mocked(auditService.recordRiskAssessmentAuditTrail).mockResolvedValue({
      auditTrailId: 'audit-001',
      userId,
      operationType: 'ASSESS_MIGRATION_RISKS',
      targetTableName: 'migration_risk_assessments',
      targetRecordId: 'risk-assess-001',
      operationStatus: 'SUCCESS',
      operationTimestamp: evaluationDateTime.toISOString(),
      createdAt: evaluationDateTime.toISOString(),
    });

    const result = await assessMigrationRisksFromMapping(input);

    // Verify evaluationDateTime is correctly set
    expect(result.evaluationDateTime).toEqual(evaluationDateTime);
    expect(result.evaluationDateTime.toISOString()).toBe('2024-11-15T14:30:45.000Z');

    // Verify evaluatedByUserId is correctly set
    expect(result.evaluatedByUserId).toBe(userId);
    expect(result.evaluatedByUserId).toBe('user-pm-12345');

    // Verify the audit trail was recorded with the correct information
    expect(auditService.recordRiskAssessmentAuditTrail).toHaveBeenCalled();
    const auditCall = jest.mocked(auditService.recordRiskAssessmentAuditTrail).mock.calls[0][0];
    expect(auditCall.userId).toBe(userId);

    // Verify saveMigrationRiskAssessment was called
    expect(persistenceService.saveMigrationRiskAssessment).toHaveBeenCalled();

    // Verify other output fields
    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);
    expect(result.riskAssessmentId).toBeDefined();
    expect(result.riskFactors).toBeDefined();
    expect(result.riskFactors.length).toBeGreaterThanOrEqual(1);
    expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallRiskScore).toBeLessThanOrEqual(100);
    expect(['低', '中', '高', '極高']).toContain(result.overallRiskLevel);
  });
});
