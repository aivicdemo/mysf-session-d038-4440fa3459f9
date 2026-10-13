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

describe('SCEN-097: 総合リスクスコアが0～100の範囲で算出され、overallRiskLevelが低・中・高・極高のいずれかに分類される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リスク要因から総合スコアが0-100の範囲で算出され、リスクレベルが正しく分類される', async () => {
    const projectId = 'proj-001';
    const targetSystemId = 'oracle-erp-01';
    const userId = 'user-12345';
    const evaluationDateTime = new Date('2026-06-15T10:30:00Z');

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'FUNCTIONAL_GAP',
        gapScore: 35,
        validationStatus: 'DETECTED',
        detectedIssues: ['Custom calculation required'],
        recommendations: ['カスタム計算式を実装'],
        riskLevel: 'HIGH',
      },
      {
        mappingDetailId: 'map-002',
        existingFunctionName: 'InvoiceLineItem__c',
        gapCategory: 'BEHAVIORAL_GAP',
        gapScore: 28,
        validationStatus: 'DETECTED',
        detectedIssues: ['Approval logic differences'],
        recommendations: ['承認ロジックを調整'],
        riskLevel: 'MEDIUM',
      },
      {
        mappingDetailId: 'map-003',
        existingFunctionName: 'Account',
        gapCategory: 'DATA_GAP',
        gapScore: 12,
        validationStatus: 'DETECTED',
        detectedIssues: ['Data mapping differences'],
        recommendations: ['データマッピング規則を定義'],
        riskLevel: 'LOW',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Invoice_Total_Calculation',
        logicType: 'FORMULA',
        migrationDifficulty: 'LOW',
        dependentLogicIds: ['Amount__c', 'Quantity__c'],
        referencedFieldCount: 2,
        migrationRisk: 'LOW',
      },
      {
        calculationLogicId: 'calc-002',
        logicName: 'Tax_Rate_Lookup',
        logicType: 'APEX_CLASS',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: ['TaxRate__c', 'TaxCategory__c', 'Region__c', 'EffectiveDate__c', 'Amount__c'],
        referencedFieldCount: 5,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'InvoiceLineItem__c',
        referenceFieldName: 'LineItems',
        cardinality: '1:N',
        isRequired: false,
        deleteAction: 'RESTRICT',
        isPartOfCircularDependency: false,
      },
      {
        referenceRelationshipId: 'ref-002',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'Account',
        cardinality: 'N:1',
        isRequired: true,
        deleteAction: 'RESTRICT',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'Invoice_Management',
        functionCategory: 'BILLING',
        complexityLevel: 95,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-002',
        functionName: 'Tax_Calculation_Engine',
        functionCategory: 'FINANCE',
        complexityLevel: 87,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-003',
        functionName: 'Custom_Approval_Flow',
        functionCategory: 'WORKFLOW',
        complexityLevel: 72,
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
      userRole: 'MIGRATION_ANALYST',
      isContextValid: true,
    });

    jest.mocked(persistenceService.saveMigrationRiskAssessment).mockResolvedValue({
      riskAssessmentId: 'risk-assess-001',
      projectId,
      riskClassification: 'OVERALL_RISK',
      riskItemName: 'Migration Risk Assessment',
      riskDescription: 'Overall risk assessment',
      occurrencePossibilityLevel: 'MEDIUM',
      impactLevel: 'MEDIUM',
      riskEvaluationScore: 45,
      remediationApproach: 'Phased migration approach',
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
    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);

    // Check overall risk score is within range 0-100
    expect(result.overallRiskScore).toBeGreaterThanOrEqual(0);
    expect(result.overallRiskScore).toBeLessThanOrEqual(100);

    // Check risk level classification
    const validRiskLevels = ['低', '中', '高', '極高'];
    expect(validRiskLevels).toContain(result.overallRiskLevel);

    // Verify consistency between score and level
    if (result.overallRiskScore <= 25) {
      expect(result.overallRiskLevel).toBe('低');
    } else if (result.overallRiskScore <= 50) {
      expect(result.overallRiskLevel).toBe('中');
    } else if (result.overallRiskScore <= 75) {
      expect(result.overallRiskLevel).toBe('高');
    } else {
      expect(result.overallRiskLevel).toBe('極高');
    }

    // Risk factors should include all gaps detected
    expect(result.riskFactors).toBeDefined();
    expect(result.riskFactors.length).toBeGreaterThanOrEqual(3);

    // Each risk factor should have required properties
    result.riskFactors.forEach((factor) => {
      expect(factor.riskFactorId).toBeDefined();
      expect(factor.riskClassification).toBeDefined();
      expect(factor.probabilityLevel).toBeDefined();
      expect(factor.impactLevel).toBeDefined();
      expect(factor.riskScore).toBeGreaterThanOrEqual(0);
      expect(factor.riskScore).toBeLessThanOrEqual(100);
    });

    // Mitigation strategies should be present
    expect(result.mitigationStrategies).toBeDefined();
    expect(result.mitigationStrategies.length).toBeGreaterThanOrEqual(2);

    // Dependency risks
    expect(result.dependencyRisks).toBeDefined();
    expect(result.dependencyRisks.length).toBeGreaterThanOrEqual(2);

    expect(result.evaluationDateTime).toEqual(evaluationDateTime);
    expect(result.evaluatedByUserId).toBe(userId);
  });
});
