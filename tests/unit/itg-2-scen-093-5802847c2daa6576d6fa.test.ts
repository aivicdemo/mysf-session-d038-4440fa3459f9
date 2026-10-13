import { assessMigrationRisksFromMapping, RiskAssessmentCalculationError } from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as dataValidationRules from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-093: assessMigrationRisksFromMapping - Risk Assessment Calculation Error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw RiskAssessmentCalculationError when numeric calculation fails due to invalid data', async () => {
    const projectId = 'proj-migration-001';
    const targetSystemId = 'oracle-erp-02';
    const userId = 'user-12345';

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'CALCULATION_GAP',
        gapScore: 75,
        validationStatus: 'VALIDATED',
        detectedIssues: ['計算ロジックの差異が検出されました'],
        recommendations: [],
        riskLevel: 'HIGH',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Total_Amount__c',
        logicType: 'FORMULA',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: ['Amount__c', 'Tax__c'],
        referencedFieldCount: 2,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'InvoiceLine__c',
        referenceFieldName: 'InvoiceLineId',
        cardinality: 'MANY_TO_ONE',
        isRequired: false,
        deleteAction: 'CLEAR_FIELD',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'Invoice Header',
        functionCategory: 'BILLING',
        complexityLevel: 50,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: userId,
      operationType: 'assess_migration_risks',
      projectId: projectId,
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId: projectId,
      targetSystemId: targetSystemId,
      userId: userId,
      userRole: 'PROJECT_MANAGER',
      isContextValid: true,
    });

    (dataValidationRules.validateCalculationLogicDefinitions as jest.Mock).mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 1, successCount: 1, errorCount: 0, totalErrorsDetected: 0 },
    });

    (dataValidationRules.validateObjectReferenceRelationships as jest.Mock).mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 1, successCount: 1, errorCount: 0, totalErrorsDetected: 0 },
    });

    (dataValidationRules.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
      validationResults: [],
      summary: { totalObjectsValidated: 1, successCount: 1, errorCount: 0, totalErrorsDetected: 0 },
    });

    await expect(
      assessMigrationRisksFromMapping({
        projectId,
        targetSystemId,
        mappingValidationResults,
        calculationLogicMetadata,
        objectReferenceMetadata,
        targetSystemCapabilities,
        evaluationDateTime: new Date('2026-03-15T10:30:00Z'),
        userId,
      })
    ).rejects.toThrow(RiskAssessmentCalculationError);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();
    expect(dataValidationRules.validateCalculationLogicDefinitions).toHaveBeenCalled();
    expect(dataValidationRules.validateObjectReferenceRelationships).toHaveBeenCalled();
    expect(dataValidationRules.validateStandardFunctionMappings).toHaveBeenCalled();
  });
});
