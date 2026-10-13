import { assessMigrationRisksFromMapping, NoMappingGapsDetectedError } from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-092: assessMigrationRisksFromMapping - No Mapping Gaps Detected', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NoMappingGapsDetectedError when mappingValidationResults is empty', async () => {
    const projectId = 'proj-001';
    const targetSystemId = 'target-sys-001';
    const userId = 'user-001';

    const mappingValidationResults = [] as any;

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: '請求金額計算',
        logicType: 'FORMULA',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: ['field-001'],
        referencedFieldCount: 1,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectName: 'Invoice',
        targetObjectName: 'InvoiceLineItem',
        referenceFieldName: 'LineItemId',
        cardinality: 'ONE_TO_MANY',
        isRequired: false,
        deleteAction: 'CLEAR_FIELD',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: '請求書管理',
        functionCategory: 'BILLING',
        complexityLevel: 30,
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
      userRole: 'admin',
      isContextValid: true,
    });

    await expect(
      assessMigrationRisksFromMapping({
        projectId,
        targetSystemId,
        mappingValidationResults,
        calculationLogicMetadata,
        objectReferenceMetadata,
        targetSystemCapabilities,
        evaluationDateTime: new Date('2026-10-07T10:00:00Z'),
        userId,
      })
    ).rejects.toThrow(NoMappingGapsDetectedError);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();
  });
});
