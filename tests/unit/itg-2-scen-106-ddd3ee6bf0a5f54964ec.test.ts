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

describe('SCEN-106: Fiscal year format error when calculating annual sales', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue({
      userId: 'user-001',
      isAuthenticated: true,
      hasPermission: true,
      userRole: 'PROJECT_MANAGER',
    });

    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue({
      projectId: 'proj-migration-001',
      targetSystemId: 'oracle-erp-system',
      isValid: true,
      userHasAccess: true,
    });

    jest.mocked(dataValidationModule.validateCalculationLogicDefinitions).mockResolvedValue({ errors: [] });
    jest.mocked(dataValidationModule.validateObjectReferenceRelationships).mockResolvedValue({ errors: [] });
    jest.mocked(dataValidationModule.validateStandardFunctionMappings).mockResolvedValue({ errors: [] });
  });

  it('should throw RiskAssessmentCalculationError when fiscal year format is invalid (202a)', async () => {
    const input = {
      projectId: 'proj-migration-001',
      targetSystemId: 'oracle-erp-system',
      mappingValidationResults: [
        {
          mappingDetailId: 'map-001',
          existingFunctionName: 'Invoice__c',
          gapCategory: 'CALCULATION_LOGIC_GAP',
          gapScore: 8.5,
          validationStatus: 'validated',
          detectedIssues: [],
          recommendations: ['Calculation logic migration requires advanced customization'],
          riskLevel: 'HIGH',
        },
      ],
      calculationLogicMetadata: [
        {
          calculationLogicId: 'calc-001',
          logicName: 'AnnualSalesforceTotal',
          logicType: 'FORMULA',
          migrationDifficulty: 'HIGH',
          dependentLogicIds: ['InvoiceAmount', 'InvoiceLineItems'],
          referencedFieldCount: 2,
          migrationRisk: 'HIGH',
        },
      ],
      objectReferenceMetadata: [
        {
          referenceRelationshipId: 'ref-001',
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
          functionName: 'StandardInvoicing',
          functionCategory: 'FINANCE',
          complexityLevel: 2,
          isMappingTarget: true,
          dependentCapabilityIds: [],
        },
      ],
      evaluationDateTime: new Date('2024-01-15T10:30:00Z'),
      userId: 'user-001',
    };

    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(RiskAssessmentCalculationError);
    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow('リスク評価の計算に失敗しました。');
  });
});
