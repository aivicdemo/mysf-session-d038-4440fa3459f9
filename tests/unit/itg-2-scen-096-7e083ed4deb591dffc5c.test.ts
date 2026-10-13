import {
  assessMigrationRisksFromMapping,
  AssessMigrationRisksFromMappingInput,
  AssessMigrationRisksFromMappingOutput,
} from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';
import * as persistenceService from '../../src/logic/mapping-persistence';
import * as auditService from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-096: オブジェクト参照関係に循環依存が存在する場合、dependencyRisksにリスク要因が含まれて返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('循環依存が検出されたとき、dependencyRisksにリスク要因が含まれる', async () => {
    const projectId = 'proj-001';
    const targetSystemId = 'target-001';
    const userId = 'user-001';
    const evaluationDateTime = new Date('2026-01-15T10:30:00Z');

    const mappingValidationResults = [
      {
        mappingDetailId: 'gap-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'data-model-gap',
        gapScore: 45,
        validationStatus: 'DETECTED',
        detectedIssues: ['Circular dependency detected'],
        recommendations: ['カスタムオブジェクトの循環依存設計をレビュー'],
        riskLevel: 'HIGH',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'InvoiceLineItem Amount calculation',
        logicType: 'FORMULA',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: ['Amount__c', 'Quantity__c'],
        referencedFieldCount: 2,
        migrationRisk: 'MEDIUM',
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
        sourceObjectName: 'InvoiceLineItem__c',
        targetObjectName: 'Invoice__c',
        referenceFieldName: 'Invoice',
        cardinality: 'N:1',
        isRequired: true,
        deleteAction: 'CASCADE',
        isPartOfCircularDependency: false,
      },
      {
        referenceRelationshipId: 'ref-003',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'Account',
        cardinality: 'N:1',
        isRequired: false,
        deleteAction: 'RESTRICT',
        isPartOfCircularDependency: false,
      },
      {
        referenceRelationshipId: 'ref-004',
        sourceObjectName: 'Account',
        targetObjectName: 'Invoice__c',
        referenceFieldName: 'Invoices',
        cardinality: '1:N',
        isRequired: false,
        deleteAction: 'RESTRICT',
        isPartOfCircularDependency: true,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'Invoice_Management',
        functionCategory: 'BILLING',
        complexityLevel: 2,
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
      riskAssessmentId: 'risk-assess-001',
      projectId,
      riskClassification: 'CIRCULAR_DEPENDENCY',
      riskItemName: 'Account-Invoice circular reference',
      riskDescription: 'Account → Invoice__c → Account による循環依存',
      occurrencePossibilityLevel: 'HIGH',
      impactLevel: 'HIGH',
      riskEvaluationScore: 65,
      remediationApproach: 'Redesign relationship structure',
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
    expect(result.projectId).toBe(projectId);
    expect(result.targetSystemId).toBe(targetSystemId);

    // dependencyRisks should include the circular dependency
    expect(result.dependencyRisks).toBeDefined();
    expect(result.dependencyRisks.length).toBeGreaterThan(0);

    const circularDependencyRisk = result.dependencyRisks.find(
      (r) => r.isCircularDependency === true
    );
    expect(circularDependencyRisk).toBeDefined();
    expect(circularDependencyRisk?.sourceElement).toMatch(/Account|Invoice__c/);
    expect(circularDependencyRisk?.targetElement).toMatch(/Account|Invoice__c/);
    expect(circularDependencyRisk?.riskDescription).toContain('循環依存');

    // riskFactors should also be present
    expect(result.riskFactors).toBeDefined();
    expect(result.riskFactors.length).toBeGreaterThanOrEqual(1);

    expect(result.evaluationDateTime).toEqual(evaluationDateTime);
    expect(result.evaluatedByUserId).toBe(userId);
  });
});
