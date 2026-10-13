import {
  validateMappingAndClassifyGaps,
  ValidationResultPersistenceFailedError,
} from '../../src/logic/mapping-validation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextService from '../../src/logic/project-context-resolver';
import * as persistenceService from '../../src/logic/mapping-persistence';
import * as auditService from '../../src/logic/audit-trail-service';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>(
    '../../src/logic/authentication-authorization'
  ),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>(
    '../../src/logic/project-context-resolver'
  ),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>(
    '../../src/logic/mapping-persistence'
  ),
  retrieveMappingDetailsForProject: jest.fn(),
  retrieveMappingDetailsByTargetSystem: jest.fn(),
  saveMappingValidationResult: jest.fn(),
}));

jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>(
    '../../src/logic/audit-trail-service'
  ),
  recordMappingValidationAuditTrail: jest.fn(),
}));

describe('SCEN-073: ValidationResultPersistenceFailedError when validation result save fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ValidationResultPersistenceFailedError when saveMappingValidationResult fails', async () => {
    const projectId = 'proj-001';
    const targetSystemId = 'sys-001';
    const userId = 'user-001';
    const sessionId = 'sess-001';
    const executionTimestamp = 1700000000000;
    const mappingDetailIds = ['mapping-detail-001', 'mapping-detail-002'];

    const mockAuthResult = {
      isAuthenticated: true,
      userRole: 'MappingValidator',
      hasProjectAccess: true,
      canExecuteValidation: true,
    };

    const mockProjectContext = {
      projectId: 'proj-001',
      targetSystemId: 'sys-001',
      projectStatus: 'active',
      systemStatus: 'configured',
      persistenceCapability: 'read_write_failed',
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'mapping-detail-001',
        sfObjectName: 'Invoice__c',
        sfFields: [
          {
            fieldName: 'Amount__c',
            dataType: 'Currency',
            isRequired: true,
          },
        ],
        calculationLogic: 'SUM(related_details.Amount__c)',
        relationships: [
          {
            relationType: 'LookupRelationship',
            relatedObject: 'Opportunity',
          },
        ],
      },
      {
        mappingDetailId: 'mapping-detail-002',
        sfObjectName: 'Invoice_Detail__c',
        sfFields: [
          {
            fieldName: 'LineAmount__c',
            dataType: 'Currency',
            isRequired: true,
          },
        ],
        calculationLogic: 'Quantity__c * Unit_Price__c',
        relationships: [],
      },
    ];

    const mockTargetCapabilities = [
      {
        targetCapabilityId: 'cap-001',
        featureName: 'Invoice Management',
        supportedFields: [
          {
            fieldName: 'invoice_amount',
            dataType: 'decimal',
            customizable: true,
          },
        ],
        supportsCalculations: true,
        apiLimitations: 'standard_api_available',
        customizationLimits: 5,
      },
      {
        targetCapabilityId: 'cap-002',
        featureName: 'Invoice Line Item',
        supportedFields: [
          {
            fieldName: 'line_amount',
            dataType: 'decimal',
            customizable: true,
          },
        ],
        supportsCalculations: true,
        apiLimitations: 'standard_api_available',
        customizationLimits: 5,
      },
    ];

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(
      mockAuthResult
    );
    (contextService.resolveProjectContext as jest.Mock).mockResolvedValue(
      mockProjectContext
    );
    (persistenceService.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(
      mockMappingDetails
    );
    (persistenceService.retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(
      mockTargetCapabilities
    );

    // Mock saveMappingValidationResult to fail
    (persistenceService.saveMappingValidationResult as jest.Mock).mockRejectedValue(
      new ValidationResultPersistenceFailedError(
        '検証結果の保存に失敗しました。'
      )
    );

    const error = await validateMappingAndClassifyGaps({
      projectId,
      targetSystemId,
      userId,
      sessionId,
      executionTimestamp,
      mappingDetailIds,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(ValidationResultPersistenceFailedError);
    expect(error.message).toBe('検証結果の保存に失敗しました。');
  });
});
