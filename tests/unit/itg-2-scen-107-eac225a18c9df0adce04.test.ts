import { assessMigrationRisksFromMapping } from '../../src/logic/risk-assessment-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as dataValidationModule from '../../src/logic/data-validation-rules';
import * as persistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-107: Three-year TCO calculation with correct risk assessment', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue({
      isAuthenticated: true,
      userId: 'user-001',
      roles: ['MIGRATION_MANAGER'],
      hasPermission: true,
    });

    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue({
      projectId: 'proj-migration-001',
      targetSystemId: 'sys-oracle-erp-001',
      isValid: true,
      userHasAccess: true,
    });

    jest.mocked(dataValidationModule.validateCalculationLogicDefinitions).mockResolvedValue({ errors: [] });
    jest.mocked(dataValidationModule.validateObjectReferenceRelationships).mockResolvedValue({ errors: [] });
    jest.mocked(dataValidationModule.validateStandardFunctionMappings).mockResolvedValue({ errors: [] });

    jest.mocked(persistenceModule.saveMigrationRiskAssessment).mockResolvedValue({
      riskAssessmentId: 'risk-assess-20241215-001',
    });

    jest.mocked(auditModule.recordRiskAssessmentAuditTrail).mockResolvedValue({
      auditId: 'audit-20241215-001',
    });
  });

  it('should calculate risk assessment with correct overall score and level', async () => {
    const input = {
      projectId: 'proj-migration-001',
      targetSystemId: 'sys-oracle-erp-001',
      mappingValidationResults: [
        {
          mappingDetailId: 'map-001',
          existingFunctionName: 'Invoice__c',
          gapCategory: 'FUNCTIONAL_GAP',
          gapScore: 45,
          validationStatus: 'validated',
          detectedIssues: [],
          recommendations: ['Custom logic implementation required'],
          riskLevel: 'MEDIUM',
        },
        {
          mappingDetailId: 'map-002',
          existingFunctionName: 'InvoiceLine__c',
          gapCategory: 'CALCULATION_GAP',
          gapScore: 65,
          validationStatus: 'validated',
          detectedIssues: [],
          recommendations: ['Calculation formula re-implementation required'],
          riskLevel: 'HIGH',
        },
      ],
      calculationLogicMetadata: [
        {
          calculationLogicId: 'calc-001',
          logicName: 'Tax exempt amount calculation',
          logicType: 'FORMULA',
          migrationDifficulty: 'HIGH',
          dependentLogicIds: ['dep1', 'dep2', 'dep3'],
          referencedFieldCount: 3,
          migrationRisk: 'HIGH',
        },
      ],
      objectReferenceMetadata: [
        {
          referenceRelationshipId: 'rel-001',
          sourceObjectName: 'Invoice__c',
          targetObjectName: 'InvoiceLine__c',
          referenceFieldName: 'InvoiceId',
          cardinality: 'ONE_TO_MANY',
          isRequired: false,
          deleteAction: 'CASCADE',
          isPartOfCircularDependency: false,
        },
      ],
      targetSystemCapabilities: [
        {
          capabilityId: 'cap-001',
          functionName: 'Master detail relationship',
          functionCategory: 'RELATIONSHIP',
          complexityLevel: 1,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
        {
          capabilityId: 'cap-002',
          functionName: 'Trigger-based calculation',
          functionCategory: 'AUTOMATION',
          complexityLevel: 3,
          isMappingTarget: false,
          dependentCapabilityIds: [],
        },
      ],
      evaluationDateTime: new Date('2024-12-15T14:30:00Z'),
      userId: 'user-001',
    };

    const result = await assessMigrationRisksFromMapping(input);

    expect(result.riskAssessmentId).toBe('risk-assess-20241215-001');
    expect(result.projectId).toBe('proj-migration-001');
    expect(result.targetSystemId).toBe('sys-oracle-erp-001');
    expect(result.evaluationDateTime).toEqual(new Date('2024-12-15T14:30:00Z'));
    expect(result.evaluatedByUserId).toBe('user-001');

    expect(result.riskFactors).toBeDefined();
    expect(Array.isArray(result.riskFactors)).toBe(true);
    expect(result.riskFactors.length).toBeGreaterThan(0);

    expect(result.overallRiskScore).toBe(59);
    expect(result.overallRiskLevel).toBe('中');

    expect(result.mitigationStrategies).toBeDefined();
    expect(Array.isArray(result.mitigationStrategies)).toBe(true);
    expect(result.mitigationStrategies.length).toBeGreaterThan(0);

    expect(result.dependencyRisks).toBeDefined();
    expect(Array.isArray(result.dependencyRisks)).toBe(true);
    expect(result.dependencyRisks.length).toBeGreaterThanOrEqual(0);
  });
});
