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

describe('SCEN-098: 検出されたリスク要因ごとに対応方針と対応策がmitigationStrategiesに含まれて返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('各リスク要因に対応する対応方針が mitigationStrategies に含まれる', async () => {
    const projectId = 'proj-20240115-001';
    const targetSystemId = 'tgt-oracle-erp-v2';
    const userId = 'user-pm-001';
    const evaluationDateTime = new Date('2024-01-15T10:30:00Z');

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'CAPABILITY_GAP',
        gapScore: 35,
        validationStatus: 'DETECTED',
        detectedIssues: ['Approval flow not standard'],
        recommendations: ['カスタム承認ロジックの開発が必要'],
        riskLevel: 'HIGH',
      },
      {
        mappingDetailId: 'map-002',
        existingFunctionName: 'InvoiceLineItem__c',
        gapCategory: 'LOGIC_GAP',
        gapScore: 48,
        validationStatus: 'DETECTED',
        detectedIssues: ['Tax calculation differs'],
        recommendations: ['計算ロジックのマッピング検証と調整が必要'],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'TaxAmount Calculation',
        logicType: 'FORMULA',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: ['UnitPrice__c', 'Quantity__c', 'TaxRate__c', 'Discount__c'],
        referencedFieldCount: 4,
        migrationRisk: 'HIGH',
      },
      {
        calculationLogicId: 'calc-002',
        logicName: 'TotalAmount Calculation',
        logicType: 'FORMULA',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: ['InvoiceLineItem__c', 'ManualAdjustment__c'],
        referencedFieldCount: 2,
        migrationRisk: 'MEDIUM',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'Account',
        cardinality: 'N:1',
        isRequired: false,
        deleteAction: 'RESTRICT',
        isPartOfCircularDependency: false,
      },
      {
        referenceRelationshipId: 'ref-002',
        sourceObjectName: 'InvoiceLineItem__c',
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
        capabilityId: 'cap-001',
        functionName: 'ApprovalWorkflow',
        functionCategory: 'WORKFLOW',
        complexityLevel: 10,
        isMappingTarget: false,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-002',
        functionName: 'TaxCalculation',
        functionCategory: 'FINANCE',
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
      userRole: 'PROJECT_MANAGER',
      isContextValid: true,
    });

    jest.mocked(persistenceService.saveMigrationRiskAssessment).mockResolvedValue({
      riskAssessmentId: 'risk-assess-001',
      projectId,
      riskClassification: 'OVERALL',
      riskItemName: 'Migration Risk Assessment',
      riskDescription: 'Overall risk assessment',
      occurrencePossibilityLevel: 'MEDIUM',
      impactLevel: 'MEDIUM',
      riskEvaluationScore: 45,
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

    expect(result).toBeDefined();
    expect(result.riskAssessmentId).toBe('risk-assess-001');

    // Risk factors should include both gaps
    expect(result.riskFactors).toBeDefined();
    expect(result.riskFactors.length).toBeGreaterThanOrEqual(2);

    const capabilityGapRisk = result.riskFactors.find(
      (r) => r.riskClassification === 'CAPABILITY_GAP'
    );
    const logicGapRisk = result.riskFactors.find((r) => r.riskClassification === 'LOGIC_GAP');

    expect(capabilityGapRisk).toBeDefined();
    expect(logicGapRisk).toBeDefined();

    // Check mitigation strategies exist
    expect(result.mitigationStrategies).toBeDefined();
    expect(result.mitigationStrategies.length).toBeGreaterThanOrEqual(
      result.riskFactors.length
    );

    // Each risk factor should have a corresponding mitigation strategy
    if (capabilityGapRisk) {
      const capabilityMitigation = result.mitigationStrategies.find(
        (m) => m.targetRiskFactorId === capabilityGapRisk.riskFactorId
      );
      expect(capabilityMitigation).toBeDefined();
      expect(capabilityMitigation?.mitigationApproach).toContain('カスタム承認ロジック');
      expect(capabilityMitigation?.mitigationActions).toBeDefined();
      expect(capabilityMitigation?.mitigationActions.length).toBeGreaterThan(0);
    }

    if (logicGapRisk) {
      const logicMitigation = result.mitigationStrategies.find(
        (m) => m.targetRiskFactorId === logicGapRisk.riskFactorId
      );
      expect(logicMitigation).toBeDefined();
      expect(logicMitigation?.mitigationApproach).toContain('計算ロジック');
      expect(logicMitigation?.mitigationActions).toBeDefined();
      expect(logicMitigation?.mitigationActions.length).toBeGreaterThan(0);
    }

    // Overall risk assessment
    expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallRiskScore).toBeLessThanOrEqual(100);
    expect(['低', '中', '高', '極高']).toContain(result.overallRiskLevel);

    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);
    expect(result.evaluationDateTime).toEqual(evaluationDateTime);
    expect(result.evaluatedByUserId).toBe(userId);
  });
});
