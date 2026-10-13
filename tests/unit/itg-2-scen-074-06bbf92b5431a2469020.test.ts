import {
  validateMappingAndClassifyGaps,
  AuditTrailRecordingFailedError,
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

describe('SCEN-074: AuditTrailRecordingFailedError when audit trail recording fails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AuditTrailRecordingFailedError when recordMappingValidationAuditTrail fails after successful validation result save', async () => {
    const projectId = 'proj-20250115-001';
    const targetSystemId = 'target-sys-oracle-billing';
    const userId = 'user-migrationmgr-001';
    const sessionId = 'session-valid-20250115-1430';
    const executionTimestamp = 1705316400000;
    const mappingDetailIds = [
      'mapping-detail-invoice-001',
      'mapping-detail-invoice-line-002',
    ];

    const mockAuthResult = {
      isAuthenticated: true,
      sessionValid: true,
      userRole: 'MappingValidator',
      hasPermission: true,
      projectAccessible: true,
      auditTrailRecordingAvailable: false,
      auditTrailRecordingError:
        'Audit trail database connection failed: timeout after 30s',
    };

    const mockProjectContext = {
      projectId: 'proj-20250115-001',
      targetSystemId: 'target-sys-oracle-billing',
      projectValid: true,
      projectStatus: 'Active',
      systemValid: true,
      systemStatus: 'Configured',
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'mapping-detail-invoice-001',
        salesforceObjectName: 'Invoice__c',
        targetSystemObjectName: 'BILL_HEADER',
        fieldMappings: [
          {
            sfField: 'InvoiceNumber__c',
            targetField: 'BILL_NUMBER',
            matchStatus: '完全対応',
          },
          {
            sfField: 'InvoiceDate__c',
            targetField: 'BILL_DATE',
            matchStatus: '完全対応',
          },
        ],
        calculationLogic: [
          {
            sfFormula: 'Amount__c * TaxRate__c',
            targetLogic: 'BILL_AMOUNT * TAX_RATE',
            logicMatch: 0.95,
          },
        ],
        relationships: [
          {
            sfRelation: 'Opportunity__r',
            targetRelation: 'ORDER_ID',
            relationMatch: 0.85,
          },
        ],
      },
      {
        mappingDetailId: 'mapping-detail-invoice-line-002',
        salesforceObjectName: 'InvoiceLine__c',
        targetSystemObjectName: 'BILL_LINE',
        fieldMappings: [
          {
            sfField: 'LineNumber__c',
            targetField: 'LINE_NUMBER',
            matchStatus: '完全対応',
          },
        ],
        calculationLogic: [],
        relationships: [
          {
            sfRelation: 'Invoice__r',
            targetRelation: 'BILL_HEADER_ID',
            relationMatch: 1,
          },
        ],
      },
    ];

    const mockTargetCapabilities = {
      systemName: 'Oracle Billing Standard',
      standardFeatures: [
        {
          featureName: 'Bill Header',
          standardFields: ['BILL_NUMBER', 'BILL_DATE', 'BILL_AMOUNT'],
          calculationSupport: true,
          apiAvailable: true,
          customizationLimits: 50,
        },
        {
          featureName: 'Bill Line',
          standardFields: ['LINE_NUMBER', 'LINE_AMOUNT'],
          calculationSupport: true,
          apiAvailable: true,
          customizationLimits: 50,
        },
      ],
      extensible: true,
    };

    const mockValidationResult = {
      saved: true,
      validationResultId: 'val-result-20250115-1430-001',
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
    (persistenceService.saveMappingValidationResult as jest.Mock).mockResolvedValue(
      mockValidationResult
    );

    // Mock recordMappingValidationAuditTrail to fail after successful save
    (auditService.recordMappingValidationAuditTrail as jest.Mock).mockRejectedValue(
      new AuditTrailRecordingFailedError('操作履歴の記録に失敗しました。')
    );

    const error = await validateMappingAndClassifyGaps({
      projectId,
      targetSystemId,
      userId,
      sessionId,
      executionTimestamp,
      mappingDetailIds,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(AuditTrailRecordingFailedError);
    expect(error.message).toBe('操作履歴の記録に失敗しました。');
    expect(persistenceService.saveMappingValidationResult).toHaveBeenCalled();
    expect(auditService.recordMappingValidationAuditTrail).toHaveBeenCalled();
  });
});
