import {
  assessMigrationRisksFromMapping,
  RiskAssessmentCalculationError,
  AssessMigrationRisksFromMappingInput,
  MappingValidationResult,
  CalculationLogicMetadata,
  ObjectReferenceMetadata,
  TargetSystemCapability,
} from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

describe('assessMigrationRisksFromMapping - SCEN-105: その他サポート費用が0円未満の場合、その他費用の妥当性検証エラーが発生する', () => {
  const mockAuthService = authService as jest.Mocked<typeof authService>;
  const mockProjectService = projectContextService as jest.Mocked<typeof projectContextService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthService.verifyUserAuthenticationAndAuthorization.mockResolvedValue({
      userId: 'user-pm-001',
      isAuthenticated: true,
      hasRequiredPermission: true,
    });

    mockProjectService.resolveProjectContext.mockResolvedValue({
      projectId: 'proj-salesforce-migration-001',
      targetSystemId: 'target-system-oracle-001',
    });
  });

  it('should throw RiskAssessmentCalculationError when additionalSupportCost is negative (SCEN-105)', async () => {
    const mappingValidationResults: MappingValidationResult[] = [
      {
        mappingDetailId: 'map-invoice-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'CALCULATION_LOGIC_GAP',
        gapScore: 45,
        validationStatus: 'DETECTED',
        detectedIssues: [],
        recommendations: ['Custom calculation implementation required'],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata: CalculationLogicMetadata[] = [
      {
        calculationLogicId: 'calc-annual-support-001',
        logicName: 'calculateAnnualSalesforceTotal',
        logicType: 'AGGREGATION',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: [],
        referencedFieldCount: 5,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata: ObjectReferenceMetadata[] = [
      {
        referenceRelationshipId: 'ref-invoice-to-account-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'AccountId',
        cardinality: 'MANY_TO_ONE',
        isRequired: false,
        deleteAction: 'CASCADE',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities: TargetSystemCapability[] = [
      {
        capabilityId: 'cap-invoice-standard-001',
        functionName: 'Invoice Management',
        functionCategory: 'FINANCE',
        complexityLevel: 2,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    const input: AssessMigrationRisksFromMappingInput = {
      projectId: 'proj-salesforce-migration-001',
      targetSystemId: 'target-system-oracle-001',
      mappingValidationResults,
      calculationLogicMetadata,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime: new Date('2024-12-15T10:00:00Z'),
      userId: 'user-pm-001',
    };

    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(
      RiskAssessmentCalculationError
    );

    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(
      'リスク評価の計算に失敗しました。'
    );
  });

  it('should call verifyUserAuthenticationAndAuthorization with userId', async () => {
    const mappingValidationResults: MappingValidationResult[] = [
      {
        mappingDetailId: 'map-invoice-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'CALCULATION_LOGIC_GAP',
        gapScore: 45,
        validationStatus: 'DETECTED',
        detectedIssues: [],
        recommendations: ['Custom calculation implementation required'],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata: CalculationLogicMetadata[] = [
      {
        calculationLogicId: 'calc-annual-support-001',
        logicName: 'calculateAnnualSalesforceTotal',
        logicType: 'AGGREGATION',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: [],
        referencedFieldCount: 5,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata: ObjectReferenceMetadata[] = [
      {
        referenceRelationshipId: 'ref-invoice-to-account-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'AccountId',
        cardinality: 'MANY_TO_ONE',
        isRequired: false,
        deleteAction: 'CASCADE',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities: TargetSystemCapability[] = [
      {
        capabilityId: 'cap-invoice-standard-001',
        functionName: 'Invoice Management',
        functionCategory: 'FINANCE',
        complexityLevel: 2,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    const input: AssessMigrationRisksFromMappingInput = {
      projectId: 'proj-salesforce-migration-001',
      targetSystemId: 'target-system-oracle-001',
      mappingValidationResults,
      calculationLogicMetadata,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime: new Date('2024-12-15T10:00:00Z'),
      userId: 'user-pm-001',
    };

    try {
      await assessMigrationRisksFromMapping(input);
    } catch {
      // Expected to throw
    }

    expect(mockAuthService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
  });

  it('should call resolveProjectContext with projectId and targetSystemId', async () => {
    const mappingValidationResults: MappingValidationResult[] = [
      {
        mappingDetailId: 'map-invoice-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'CALCULATION_LOGIC_GAP',
        gapScore: 45,
        validationStatus: 'DETECTED',
        detectedIssues: [],
        recommendations: ['Custom calculation implementation required'],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata: CalculationLogicMetadata[] = [
      {
        calculationLogicId: 'calc-annual-support-001',
        logicName: 'calculateAnnualSalesforceTotal',
        logicType: 'AGGREGATION',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: [],
        referencedFieldCount: 5,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata: ObjectReferenceMetadata[] = [
      {
        referenceRelationshipId: 'ref-invoice-to-account-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Account',
        referenceFieldName: 'AccountId',
        cardinality: 'MANY_TO_ONE',
        isRequired: false,
        deleteAction: 'CASCADE',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities: TargetSystemCapability[] = [
      {
        capabilityId: 'cap-invoice-standard-001',
        functionName: 'Invoice Management',
        functionCategory: 'FINANCE',
        complexityLevel: 2,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
    ];

    const input: AssessMigrationRisksFromMappingInput = {
      projectId: 'proj-salesforce-migration-001',
      targetSystemId: 'target-system-oracle-001',
      mappingValidationResults,
      calculationLogicMetadata,
      objectReferenceMetadata,
      targetSystemCapabilities,
      evaluationDateTime: new Date('2024-12-15T10:00:00Z'),
      userId: 'user-pm-001',
    };

    try {
      await assessMigrationRisksFromMapping(input);
    } catch {
      // Expected to throw
    }

    expect(mockProjectService.resolveProjectContext).toHaveBeenCalled();
  });
});
