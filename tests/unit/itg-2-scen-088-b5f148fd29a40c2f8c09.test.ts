import { assessMigrationRisksFromMapping, InvalidMappingValidationResultsError } from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-088: assessMigrationRisksFromMapping - Invalid Mapping Validation Results', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidMappingValidationResultsError when mappingValidationResults is null', async () => {
    const projectId = 'proj-001';
    const targetSystemId = 'target-sys-001';
    const userId = 'user-001';

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Invoice Amount Calculation',
        logicType: 'FORMULA',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: [],
        referencedFieldCount: 2,
        migrationRisk: 'MEDIUM',
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
        functionName: 'Billing',
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
      userRole: 'MIGRATION_ANALYST',
      isContextValid: true,
    });

    await expect(
      assessMigrationRisksFromMapping({
        projectId,
        targetSystemId,
        mappingValidationResults: null as any,
        calculationLogicMetadata,
        objectReferenceMetadata,
        targetSystemCapabilities,
        evaluationDateTime: new Date('2026-10-07T10:00:00Z'),
        userId,
      })
    ).rejects.toThrow(InvalidMappingValidationResultsError);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();
  });
});
