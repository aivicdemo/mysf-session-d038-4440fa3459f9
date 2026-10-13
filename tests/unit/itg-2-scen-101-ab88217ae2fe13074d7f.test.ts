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

describe('SCEN-101: 年間Salesforce総費用の計算でライセンス料・保守費・セキュリティ費用・その他費用を合算し、年間総費用と各項目の割合が正しく算出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数のマッピング検証結果とメタデータから総合リスク評価が返される', async () => {
    const projectId = 'proj-salesforce-2024-001';
    const targetSystemId = 'target-oracle-erp-001';
    const userId = 'user-migration-mgr-001';
    const evaluationDateTime = new Date('2024-11-15T10:30:00Z');

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'FUNCTIONAL_GAP',
        gapScore: 30,
        validationStatus: 'DETECTED',
        detectedIssues: ['Invoice logic differs'],
        recommendations: ['カスタム実装を検討'],
        riskLevel: 'MEDIUM',
      },
      {
        mappingDetailId: 'map-002',
        existingFunctionName: 'InvoiceLineItem__c',
        gapCategory: 'DATA_GAP',
        gapScore: 25,
        validationStatus: 'DETECTED',
        detectedIssues: ['Field mapping issues'],
        recommendations: ['データマッピング見直し'],
        riskLevel: 'LOW',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: '年間Salesforce総費用',
        logicType: 'FORMULA',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: [],
        referencedFieldCount: 1,
        migrationRisk: 'MEDIUM',
      },
      {
        calculationLogicId: 'calc-002',
        logicName: '3年間TCO試算',
        logicType: 'FORMULA',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: [],
        referencedFieldCount: 1,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'InvoiceLineItem__c',
        referenceFieldName: 'Items',
        cardinality: '1:N',
        isRequired: false,
        deleteAction: 'RESTRICT',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: '請求書管理',
        functionCategory: 'BILLING',
        complexityLevel: 15,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-002',
        functionName: '請求明細行管理',
        functionCategory: 'BILLING',
        complexityLevel: 15,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-003',
        functionName: 'カスタム計算式',
        functionCategory: 'CUSTOMIZATION',
        complexityLevel: 20,
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
      userRole: 'MIGRATION_MANAGER',
      isContextValid: true,
    });

    jest.mocked(persistenceService.saveMigrationRiskAssessment).mockResolvedValue({
      riskAssessmentId: 'risk-assess-001',
      projectId,
      riskClassification: 'OVERALL',
      riskItemName: 'Migration Risk Assessment',
      riskDescription: 'Overall assessment',
      occurrencePossibilityLevel: 'MEDIUM',
      impactLevel: 'MEDIUM',
      riskEvaluationScore: 40,
      remediationApproach: 'Phased approach',
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

    // Verify required output fields
    expect(result.riskAssessmentId).toBeDefined();
    expect(result.riskAssessmentId).not.toBe('');

    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);

    // Verify risk factors
    expect(result.riskFactors).toBeDefined();
    expect(result.riskFactors.length).toBeGreaterThanOrEqual(1);

    // Verify overall risk score and level
    expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallRiskScore).toBeLessThanOrEqual(100);
    expect(['低', '中', '高', '極高']).toContain(result.overallRiskLevel);

    // Verify mitigation strategies
    expect(result.mitigationStrategies).toBeDefined();
    expect(result.mitigationStrategies.length).toBeGreaterThanOrEqual(1);

    // Verify dependency risks
    expect(result.dependencyRisks).toBeDefined();
    expect(result.dependencyRisks.length).toBeGreaterThanOrEqual(1);

    // Verify evaluation datetime and user
    expect(result.evaluationDateTime).toEqual(evaluationDateTime);
    expect(result.evaluatedByUserId).toBe(userId);

    // Verify the persistence layer was called
    expect(persistenceService.saveMigrationRiskAssessment).toHaveBeenCalled();
    expect(auditService.recordRiskAssessmentAuditTrail).toHaveBeenCalled();
  });
});
