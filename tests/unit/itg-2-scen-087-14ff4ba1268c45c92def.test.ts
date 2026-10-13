import { assessMigrationRisksFromMapping, InvalidProjectContextError } from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-087: assessMigrationRisksFromMapping - Invalid Project Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidProjectContextError when project context cannot be resolved', async () => {
    const projectId = 'proj-001';
    const targetSystemId = 'target-sys-001';
    const userId = 'user-001';

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'FUNCTIONAL_GAP',
        gapScore: 85,
        validationStatus: 'VALIDATED',
        detectedIssues: ['実装カスタマイズが必要'],
        recommendations: [],
        riskLevel: 'HIGH',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-001',
        logicName: 'Calculation Logic',
        logicType: 'FORMULA',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: ['dep-1', 'dep-2'],
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
        cardinality: 'ONE_TO_MANY',
        isRequired: false,
        deleteAction: 'CLEAR_FIELD',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-001',
        functionName: 'INVOICE_MANAGEMENT',
        functionCategory: 'BILLING',
        complexityLevel: 25,
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

    (projectContextResolver.resolveProjectContext as jest.Mock).mockRejectedValue(
      new InvalidProjectContextError('プロジェクトコンテキストが無効です。')
    );

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
    ).rejects.toThrow(InvalidProjectContextError);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();
  });
});
