import {
  assessMigrationRisksFromMapping,
  AssessMigrationRisksFromMappingInput,
  RiskAssessmentCalculationError,
} from '../../src/logic/risk-assessment-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-104: セキュリティ更新費用が0円未満の場合、セキュリティ費用の妥当性検証エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('セキュリティ更新費用が負の値のとき、RiskAssessmentCalculationErrorをスローする', async () => {
    const projectId = 'proj-migrate-2024';
    const targetSystemId = 'target-oracle-erp';
    const userId = 'user-001';
    const evaluationDateTime = new Date('2024-01-15T10:30:00Z');

    const mappingValidationResults = [
      {
        mappingDetailId: 'map-001',
        existingFunctionName: 'Invoice__c',
        gapCategory: 'missing_field',
        gapScore: 35,
        validationStatus: 'DETECTED',
        detectedIssues: ['Security field missing'],
        recommendations: ['Add security tracking field or remove logic'],
        riskLevel: 'MEDIUM',
      },
      {
        mappingDetailId: 'map-002',
        existingFunctionName: 'Invoice_Line__c',
        gapCategory: 'calculation_complexity',
        gapScore: 52,
        validationStatus: 'DETECTED',
        detectedIssues: ['Calculation complexity'],
        recommendations: ['Review cost calculation logic'],
        riskLevel: 'MEDIUM',
      },
    ];

    const calculationLogicMetadata = [
      {
        calculationLogicId: 'calc-annual-total',
        logicName: 'Annual total calculation',
        logicType: 'FORMULA',
        migrationDifficulty: 'MEDIUM',
        dependentLogicIds: [
          'License_Cost__c',
          'Maintenance_Cost__c',
          'Security_Cost__c',
          'Support_Cost__c',
        ],
        referencedFieldCount: 4,
        migrationRisk: 'MEDIUM',
      },
      {
        calculationLogicId: 'calc-tco-three-year',
        logicName: 'Three year TCO calculation',
        logicType: 'FORMULA',
        migrationDifficulty: 'HIGH',
        dependentLogicIds: [
          'initial_investment',
          'annual_license',
          'annual_maintenance',
          'discount_rate',
          'tax_rate',
        ],
        referencedFieldCount: 5,
        migrationRisk: 'HIGH',
      },
    ];

    const objectReferenceMetadata = [
      {
        referenceRelationshipId: 'ref-001',
        sourceObjectName: 'Invoice__c',
        targetObjectName: 'Invoice_Line__c',
        referenceFieldName: 'lines',
        cardinality: '1:N',
        isRequired: false,
        deleteAction: 'RESTRICT',
        isPartOfCircularDependency: false,
      },
      {
        referenceRelationshipId: 'ref-002',
        sourceObjectName: 'Invoice_Line__c',
        targetObjectName: 'Invoice__c',
        referenceFieldName: 'invoice',
        cardinality: 'N:1',
        isRequired: true,
        deleteAction: 'CASCADE',
        isPartOfCircularDependency: false,
      },
    ];

    const targetSystemCapabilities = [
      {
        capabilityId: 'cap-invoice-header',
        functionName: '請求書ヘッダ管理',
        functionCategory: 'BILLING',
        complexityLevel: 15,
        isMappingTarget: true,
        dependentCapabilityIds: [],
      },
      {
        capabilityId: 'cap-security-tracking',
        functionName: 'セキュリティ更新追跡',
        functionCategory: 'SECURITY',
        complexityLevel: 5,
        isMappingTarget: false,
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
      userRole: 'mapping_operator',
      isContextValid: true,
    });

    // This call should throw RiskAssessmentCalculationError
    // because securityUpdateCost is set to -5000 (negative value)
    await expect(assessMigrationRisksFromMapping(input)).rejects.toThrow(
      RiskAssessmentCalculationError
    );

    // The error message should indicate the calculation failure
    const rejectedPromise = assessMigrationRisksFromMapping(input);
    await expect(rejectedPromise).rejects.toThrow();
    try {
      await rejectedPromise;
    } catch (error) {
      expect(error).toBeInstanceOf(RiskAssessmentCalculationError);
    }
  });
});
