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

describe('SCEN-099: 生成されたリスク評価レコードの一意識別子がriskAssessmentIdとして返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveMigrationRiskAssessmentから返されたriskAssessmentIdが出力に含まれる', async () => {
    const projectId = 'proj-sf-001';
    const targetSystemId = 'target-sys-001';
    const userId = 'user-001';
    const evaluationDateTime = new Date('2025-06-15T10:30:00Z');
    const expectedRiskAssessmentId = 'risk-assess-2025-06-15-uuid-a1b2c3d4';

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'CustomField',
        gapCategory: 'MISSING_FIELD',
        gapScore: 0.85,
        validationStatus: 'DETECTED',
        detectedIssues: ['Field not in target system'],
        recommendations: ['カスタムフィールドの追加実装が必要'],
        riskLevel: 'HIGH',
      },
      {
        mappingDetailId: 'map-002',
        existingFunctionName: 'CalculationLogic',
        gapCategory: 'CALCULATION_LOGIC_MISMATCH',
        gapScore: 0.72,
        validationStatus: 'DETECTED',
        detectedIssues: ['Logic differs in target'],
        recommendations: ['計算ロジックの検証と調整が必要'],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Complex Calculation',
        logicType: 'APEX_CLASS',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: ['field1', 'field2', 'field3'],
        referencedFieldCount: 3,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectName: 'Object1',
        targetObjectName: 'Object2',
        referenceFieldName: 'ref',
        cardinality: '1:N',
        isRequired: false,
        deleteAction: 'RESTRICT',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'custom_field_support',
        functionCategory: 'CUSTOMIZATION',
        complexityLevel: 10,
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
      userRole: 'migration-analyst',
      isContextValid: true,
    });

    jest.mocked(persistenceService.saveMigrationRiskAssessment).mockResolvedValue({
      riskAssessmentId: expectedRiskAssessmentId,
      projectId,
      riskClassification: 'OVERALL',
      riskItemName: 'Migration Risk Assessment',
      riskDescription: 'Overall assessment',
      occurrencePossibilityLevel: 'MEDIUM',
      impactLevel: 'MEDIUM',
      riskEvaluationScore: 50,
      remediationApproach: 'Standard approach',
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
      targetRecordId: expectedRiskAssessmentId,
      operationStatus: 'SUCCESS',
      operationTimestamp: evaluationDateTime.toISOString(),
      createdAt: evaluationDateTime.toISOString(),
    });

    const result = await assessMigrationRisksFromMapping(input);

    expect(result).toBeDefined();
    expect(result.riskAssessmentId).toBe(expectedRiskAssessmentId);
    expect(result.riskAssessmentId).not.toBeNull();
    expect(result.riskAssessmentId).not.toBe('');
    expect(result.riskAssessmentId).toBeDefined();

    // Verify saveMigrationRiskAssessment was called
    expect(persistenceService.saveMigrationRiskAssessment).toHaveBeenCalled();

    // Verify other output fields
    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);
    expect(result.evaluationDateTime).toEqual(evaluationDateTime);
    expect(result.evaluatedByUserId).toBe(userId);
  });
});
