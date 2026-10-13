import {
  validateMappingAndClassifyGaps,
  RiskLevelDeterminationFailedError,
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

describe('SCEN-072: RiskLevelDeterminationFailedError when risk level determination fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw RiskLevelDeterminationFailedError when determineValidationRiskLevel fails', async () => {
    const projectId = 'proj-001';
    const targetSystemId = 'sys-oracle-001';
    const userId = 'user-admin-001';
    const sessionId = 'session-valid-001';
    const executionTimestamp = 1704067200000;
    const mappingDetailIds = ['mapping-detail-001', 'mapping-detail-002'];

    const mockAuthResult = {
      isAuthenticated: true,
      userId: 'user-admin-001',
      role: 'ProjectManager',
      hasValidSession: true,
      projectAccessPermission: 'full',
      canExecuteMappingValidation: true,
    };

    const mockProjectContext = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      projectStatus: 'active',
      systemStatus: 'available',
      isContextValid: true,
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'mapping-detail-001',
        salesforceObjectName: 'Invoice__c',
        targetSystemObjectName: 'INV_HEADER',
        fieldMappings: [
          {
            sfField: 'InvoiceNumber__c',
            targetField: 'inv_no',
            dataType: 'String',
          },
          {
            sfField: 'InvoiceAmount__c',
            targetField: 'inv_amount',
            dataType: 'Number',
          },
        ],
        calculationLogics: [
          {
            sfFormula: 'SUM(Amount__c)',
            targetLogic: 'SUM(inv_line_amount)',
            matchLevel: 0.95,
          },
        ],
        relationships: [
          {
            sfRelationship: 'Opportunity.Id',
            targetRelationship: 'opportunity_id',
            matchLevel: 1,
          },
        ],
      },
      {
        mappingDetailId: 'mapping-detail-002',
        salesforceObjectName: 'InvoiceLine__c',
        targetSystemObjectName: 'INV_LINE',
        fieldMappings: [
          {
            sfField: 'LineNumber__c',
            targetField: 'line_num',
            dataType: 'String',
          },
        ],
        calculationLogics: [],
        relationships: [],
      },
    ];

    const mockTargetCapabilities = {
      systemId: 'sys-oracle-001',
      standardFeatures: [
        {
          featureName: 'InvoiceHeader',
          fields: ['inv_no', 'inv_amount', 'inv_date'],
          calculationCapability: true,
          relationshipSupport: true,
        },
        {
          featureName: 'InvoiceLine',
          fields: ['line_num', 'line_amount'],
          calculationCapability: false,
          relationshipSupport: true,
        },
      ],
      customizationConstraints: {
        api_availability: true,
        customization_limits: 50,
        maxCustomFields: 100,
      },
    };

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

    // Call the function and expect RiskLevelDeterminationFailedError
    const error = await validateMappingAndClassifyGaps({
      projectId,
      targetSystemId,
      userId,
      sessionId,
      executionTimestamp,
      mappingDetailIds,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(RiskLevelDeterminationFailedError);
    expect(error.message).toBe('リスクレベルの判定に失敗しました。');
    expect(persistenceService.saveMappingValidationResult).not.toHaveBeenCalled();
    expect(auditService.recordMappingValidationAuditTrail).not.toHaveBeenCalled();
  });
});
