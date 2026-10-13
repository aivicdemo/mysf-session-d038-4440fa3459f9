import { assessMigrationRisksFromMapping } from '../../src/logic/risk-assessment-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as contextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';
import * as persistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));
jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));
jest.mock('../../src/logic/data-validation-rules', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-validation-rules')>('../../src/logic/data-validation-rules'),
  validateCalculationLogicDefinitions: jest.fn(),
  validateObjectReferenceRelationships: jest.fn(),
  validateStandardFunctionMappings: jest.fn(),
}));
jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  saveMigrationRiskAssessment: jest.fn(),
}));
jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>('../../src/logic/audit-trail-service'),
  recordRiskAssessmentAuditTrail: jest.fn(),
}));

describe('SCEN-115: 依存関係リスクの検出と評価', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId: 'user-123',
      authenticated: true,
      authorized: true,
      roles: ['functional_mapper', 'risk_assessor'],
    });

    (contextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: 'proj-001',
      targetSystemId: 'oracle-erp-01',
    });

    (validationModule.validateCalculationLogicDefinitions as jest.Mock).mockResolvedValue({
      valid: true,
    });

    (validationModule.validateObjectReferenceRelationships as jest.Mock).mockResolvedValue({
      valid: true,
    });

    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      valid: true,
    });

    (persistenceModule.saveMigrationRiskAssessment as jest.Mock).mockResolvedValue({
      riskAssessmentId: 'risk-assess-001',
      savedAt: '2026-10-07T10:30:00.000Z',
    });

    (auditModule.recordRiskAssessmentAuditTrail as jest.Mock).mockResolvedValue({
      recordedAt: '2026-10-07T10:30:00.000Z',
    });
  });

  it('should include dependency risks with multiple calculation logic and object reference dependencies', async () => {
    const input = {
      projectId: 'proj-001',
      targetSystemId: 'oracle-erp-01',
      mappingValidationResults: [
        {
          mappingDetailId: 'map-001',
          existingFunctionName: 'Invoice__c.Amount__c',
          gapCategory: 'calculation_logic_mismatch',
          gapScore: 75,
          validationStatus: '検証済',
          detectedIssues: [],
          recommendations: ['カスタム計算ロジックの移行が必要'],
          riskLevel: '高',
        },
        {
          mappingDetailId: 'map-002',
          existingFunctionName: 'Invoice_Line__c.Quantity__c',
          gapCategory: 'field_precision_difference',
          gapScore: 45,
          validationStatus: '検証済',
          detectedIssues: [],
          recommendations: ['データ型変換とバリデーションが必要'],
          riskLevel: '中',
        },
      ],
      calculationLogicMetadata: [
        {
          calculationLogicId: 'calc-001',
          logicName: 'Invoice Total Calculation',
          logicType: 'database_trigger',
          migrationDifficulty: '高',
          dependentLogicIds: [],
          referencedFieldCount: 2,
          migrationRisk: 'trigger_compatibility',
        },
        {
          calculationLogicId: 'calc-002',
          logicName: 'Line Item Net Amount',
          logicType: 'standard_formula',
          migrationDifficulty: '中',
          dependentLogicIds: [],
          referencedFieldCount: 1,
          migrationRisk: 'formula_precision',
        },
      ],
      objectReferenceMetadata: [
        {
          referenceRelationshipId: 'ref-001',
          sourceObjectName: 'Invoice__c',
          targetObjectName: 'Invoice_Line__c',
          referenceFieldName: 'Invoice__r',
          cardinality: '1:N',
          isRequired: false,
          deleteAction: 'restrict',
          isPartOfCircularDependency: false,
        },
        {
          referenceRelationshipId: 'ref-002',
          sourceObjectName: 'Invoice__c',
          targetObjectName: 'Account',
          referenceFieldName: 'Account__r',
          cardinality: 'N:1',
          isRequired: false,
          deleteAction: 'restrict',
          isPartOfCircularDependency: false,
        },
      ],
      targetSystemCapabilities: [
        {
          capabilityId: 'cap-001',
          functionName: 'Trigger-Based Calculation',
          functionCategory: 'calculation',
          complexityLevel: 4,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
        {
          capabilityId: 'cap-002',
          functionName: 'Master-Detail Relationship',
          functionCategory: 'relationship',
          complexityLevel: 2,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
      ],
      evaluationDateTime: new Date('2026-10-07T10:30:00.000Z'),
      userId: 'user-123',
    };

    const result = await assessMigrationRisksFromMapping(input);

    expect(result.riskAssessmentId).toBe('risk-assess-001');
    expect(result.projectId).toBe('proj-001');
    expect(result.targetSystemId).toBe('oracle-erp-01');
    expect(result.dependencyRisks).toBeInstanceOf(Array);
    expect(result.dependencyRisks.length).toBeGreaterThanOrEqual(1);
    expect(result.riskFactors).toBeInstanceOf(Array);
    expect(result.riskFactors.length).toBeGreaterThanOrEqual(1);
    expect(result.overallRiskScore).toBeDefined();
    expect(result.overallRiskLevel).toBeDefined();
    expect(result.mitigationStrategies).toBeInstanceOf(Array);
    expect(result.evaluationDateTime).toEqual(new Date('2026-10-07T10:30:00.000Z'));
    expect(result.evaluatedByUserId).toBe('user-123');

    expect(persistenceModule.saveMigrationRiskAssessment).toHaveBeenCalled();
    expect(auditModule.recordRiskAssessmentAuditTrail).toHaveBeenCalled();
  });
});
