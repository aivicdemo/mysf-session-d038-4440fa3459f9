import { assessMigrationRisksFromMapping, RiskAssessmentCalculationError } from '../../src/logic/risk-assessment-service';
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

describe('SCEN-108: Initial investment amount validation error', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue({
      userId: 'user-001',
    });

    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue({
      projectId: 'proj-migration-001',
      targetSystemId: 'oracle-erp-system',
    });

    jest.mocked(dataValidationModule.validateCalculationLogicDefinitions).mockResolvedValue({ errors: [] });
    jest.mocked(dataValidationModule.validateObjectReferenceRelationships).mockResolvedValue({ errors: [] });
    jest.mocked(dataValidationModule.validateStandardFunctionMappings).mockResolvedValue({ errors: [] });

    jest.mocked(persistenceModule.saveMigrationRiskAssessment).mockResolvedValue({
      riskAssessmentId: 'risk-assess-001',
    });

    jest.mocked(auditModule.recordRiskAssessmentAuditTrail).mockResolvedValue({
      auditId: 'audit-001',
    });
  });

  it('should throw RiskAssessmentCalculationError when initial investment is negative', async () => {
    const input = {
      projectId: 'proj-migration-001',
      targetSystemId: 'oracle-erp-system',
      mappingValidationResults: [
        {
          mappingDetailId: 'map-001',
          existingFunctionName: 'Invoice',
          gapCategory: 'FUNCTIONAL_GAP',
          gapScore: 65,
          validationStatus: 'validated',
          detectedIssues: [],
          recommendations: ['Custom calculation logic required'],
          riskLevel: 'HIGH',
        },
      ],
      calculationLogicMetadata: [
        {
          calculationLogicId: 'calc-001',
          logicName: 'Invoice Total Calculation',
          logicType: 'FORMULA',
          migrationDifficulty: 'HIGH',
          dependentLogicIds: ['Invoice_Line_Items__c'],
          referencedFieldCount: 1,
          migrationRisk: 'HIGH',
        },
      ],
      objectReferenceMetadata: [
        {
          referenceRelationshipId: 'ref-001',
          sourceObjectName: 'Invoice',
          targetObjectName: 'InvoiceDetail',
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
          functionName: 'Invoice Management',
          functionCategory: 'FINANCE',
          complexityLevel: 1,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
      ],
      evaluationDateTime: new Date('2026-01-15T10:30:00Z'),
      userId: 'user-001',
    };

    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(RiskAssessmentCalculationError);
    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow('リスク評価の計算に失敗しました。');
  });
});
