import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-059: validateMappingAndClassifyGaps - 正常系：mappingDetailIds で特定のマッピング詳細を指定', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate only specified mapping details when mappingDetailIds is provided', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-001',
      targetSystemId: 'target-sys-001',
      userId: 'user-001',
      sessionId: 'session-abc123',
      executionTimestamp: 1672531200000,
      mappingDetailIds: ['mapping-detail-001', 'mapping-detail-002'],
    };

    const authResult = {
      isAuthenticated: true,
      userId: 'user-001',
      sessionValid: true,
      hasRequiredRole: true,
      hasProjectAccess: true,
      auditTrailId: 'audit-trail-001',
    };

    const projectResult = {
      projectId: 'proj-001',
      targetSystemId: 'target-sys-001',
      projectStatus: 'active',
      projectValid: true,
      systemValid: true,
    };

    const mappingDetails = [
      {
        id: 'mapping-detail-001',
        projectId: 'proj-001',
        salesforceObjectName: 'Invoice__c',
        targetSystemObjectName: 'BL_INVOICE',
        fieldMappings: [{ sfFieldName: 'InvoiceNumber__c', sfFieldType: 'Text', targetFieldName: 'INVOICE_NO', targetFieldType: 'VARCHAR2' }],
        calculationLogic: 'SUM(InvoiceLineItem__r.Amount__c)',
        relationships: ['Invoice__c.Account__c -> Account.Id'],
      },
      {
        id: 'mapping-detail-002',
        projectId: 'proj-001',
        salesforceObjectName: 'InvoiceLineItem__c',
        targetSystemObjectName: 'BL_INVOICE_LINE',
        fieldMappings: [{ sfFieldName: 'LineAmount__c', sfFieldType: 'Currency', targetFieldName: 'LINE_AMOUNT', targetFieldType: 'NUMBER' }],
        calculationLogic: 'Quantity__c * UnitPrice__c',
        relationships: ['InvoiceLineItem__c.Invoice__c -> Invoice__c.Id'],
      },
      {
        id: 'mapping-detail-003',
        projectId: 'proj-001',
        salesforceObjectName: 'Account',
        targetSystemObjectName: 'BL_CUSTOMER',
        fieldMappings: [{ sfFieldName: 'Name', sfFieldType: 'Text', targetFieldName: 'CUSTOMER_NAME', targetFieldType: 'VARCHAR2' }],
        calculationLogic: null,
        relationships: [],
      },
    ];

    const targetCapabilities = {
      targetSystemId: 'target-sys-001',
      standardCapabilities: [
        {
          featureName: 'Invoice Management',
          objectName: 'BL_INVOICE',
          supportedFields: [
            { fieldName: 'INVOICE_NO', fieldType: 'VARCHAR2', required: true, customizable: true },
            { fieldName: 'INVOICE_DATE', fieldType: 'DATE', required: true, customizable: false },
          ],
          calculationCapability: 'basic_aggregation',
          apiAvailability: true,
          customizationLimits: 5,
        },
        {
          featureName: 'Invoice Line Management',
          objectName: 'BL_INVOICE_LINE',
          supportedFields: [
            { fieldName: 'LINE_AMOUNT', fieldType: 'NUMBER', required: true, customizable: true },
            { fieldName: 'QUANTITY', fieldType: 'NUMBER', required: true, customizable: true },
          ],
          calculationCapability: 'arithmetic_operations',
          apiAvailability: true,
          customizationLimits: 3,
        },
      ],
    };

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);
    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue(projectResult);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsForProject).mockResolvedValue(mappingDetails);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsByTargetSystem).mockResolvedValue(targetCapabilities);
    jest.mocked(mappingPersistenceModule.saveMappingValidationResult).mockResolvedValue({ validationResultId: 'val-result-001', savedSuccessfully: true, timestamp: 1672531200000 });
    jest.mocked(auditModule.recordMappingValidationAuditTrail).mockResolvedValue({ auditRecordId: 'audit-rec-001', recordedSuccessfully: true });

    const result = await validateMappingAndClassifyGaps(input);

    expect(result.validationResultId).toBe('val-result-001');
    expect(result.projectId).toBe('proj-001');
    expect(result.targetSystemId).toBe('target-sys-001');
    expect(result.validationStatus).toBe('completed');
    expect(result.validationTimestamp).toBe(1672531200000);
    expect(result.classificationResults).toHaveLength(2);
    expect(result.classificationResults.map((r: any) => r.mappingDetailId)).toEqual(['mapping-detail-001', 'mapping-detail-002']);
    expect(result.classificationResults.every((r: any) => r.mappingDetailId !== 'mapping-detail-003')).toBe(true);

    expect(mappingPersistenceModule.retrieveMappingDetailsForProject).toHaveBeenCalled();
    expect(mappingPersistenceModule.saveMappingValidationResult).toHaveBeenCalled();
    expect(auditModule.recordMappingValidationAuditTrail).toHaveBeenCalled();
  });
});
