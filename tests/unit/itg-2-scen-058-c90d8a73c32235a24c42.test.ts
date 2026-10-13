import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput, ValidateMappingAndClassifyGapsOutput, UserNotAuthenticatedError, UserUnauthorizedError, ProjectContextNotResolvedError, MappingDetailsNotFoundError, TargetSystemCapabilitiesNotFoundError, InvalidMappingDataError, GapClassificationFailedError } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-058: validateMappingAndClassifyGaps - 正常系：全マッピング詳細が検証対象', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate mapping and classify gaps with complete context', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      userId: 'user-001',
      sessionId: 'session-abc123',
      executionTimestamp: 1704067200000,
      mappingDetailIds: undefined,
    };

    const authResult = {
      userId: 'user-001',
      sessionId: 'session-abc123',
      isAuthenticated: true,
      role: 'MappingValidator',
      hasAccessToProject: true,
      canExecuteMappingValidation: true,
    };

    const projectResult = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      projectStatus: 'active',
      systemStatus: 'active',
      isValidContext: true,
    };

    const mappingDetails = [
      {
        mappingDetailId: 'map-001',
        sfObjectName: 'Invoice__c',
        sfFields: [
          { fieldName: 'InvoiceNumber__c', dataType: 'Text', isMandatory: true, calculationLogic: null },
          { fieldName: 'InvoiceAmount__c', dataType: 'Currency', isMandatory: true, calculationLogic: 'SUM(InvoiceLineItem__r.Amount__c)' },
        ],
        relationships: [{ relatedObject: 'InvoiceLineItem__c', relationType: 'master-detail' }],
      },
      {
        mappingDetailId: 'map-002',
        sfObjectName: 'InvoiceLineItem__c',
        sfFields: [
          { fieldName: 'LineNumber__c', dataType: 'Number', isMandatory: true, calculationLogic: null },
          { fieldName: 'Amount__c', dataType: 'Currency', isMandatory: true, calculationLogic: null },
        ],
        relationships: [{ relatedObject: 'Invoice__c', relationType: 'detail' }],
      },
    ];

    const targetCapabilities = [
      {
        capabilityId: 'cap-001',
        targetObjectName: 'AR_INVOICES',
        targetFields: [
          { fieldName: 'INVOICE_NUMBER', dataType: 'VARCHAR2(50)', isMandatory: true, supportedFeatures: ['basic'] },
          { fieldName: 'INVOICE_AMOUNT', dataType: 'NUMBER(15,2)', isMandatory: true, supportedFeatures: ['calculation', 'aggregation'] },
        ],
        calculationCapability: 'supported',
        relationshipCapability: 'supported',
        customizationLimits: 100,
        apiAvailability: true,
      },
      {
        capabilityId: 'cap-002',
        targetObjectName: 'AR_INVOICE_LINES',
        targetFields: [
          { fieldName: 'LINE_NUMBER', dataType: 'NUMBER(10)', isMandatory: true, supportedFeatures: ['basic'] },
          { fieldName: 'LINE_AMOUNT', dataType: 'NUMBER(15,2)', isMandatory: true, supportedFeatures: ['basic'] },
        ],
        calculationCapability: 'supported',
        relationshipCapability: 'supported',
        customizationLimits: 100,
        apiAvailability: true,
      },
    ];

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);
    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue(projectResult);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsForProject).mockResolvedValue(mappingDetails);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsByTargetSystem).mockResolvedValue(targetCapabilities);
    jest.mocked(auditModule.recordMappingValidationAuditTrail).mockResolvedValue({ auditTrailId: 'audit-001' });
    jest.mocked(mappingPersistenceModule.saveMappingValidationResult).mockResolvedValue({ validationResultId: 'validation-result-001' });

    const result = await validateMappingAndClassifyGaps(input);

    expect(result.validationResultId).toBe('validation-result-001');
    expect(result.projectId).toBe('proj-001');
    expect(result.targetSystemId).toBe('sys-oracle-001');
    expect(result.validationStatus).toBe('完了');
    expect(result.validationTimestamp).toBe(1704067200000);
    expect(result.classificationResults).toHaveLength(2);
    expect(result.classificationResults[0].mappingDetailId).toBe('map-001');
    expect(result.classificationResults[0].gapCategory).toBe('完全対応');
    expect(result.classificationResults[0].gapScore).toBe(0);
    expect(result.classificationResults[1].mappingDetailId).toBe('map-002');
    expect(result.classificationResults[1].gapCategory).toBe('完全対応');
    expect(result.classificationResults[1].gapScore).toBe(0);
    expect(result.overallRiskLevel).toBe('低');
    expect(result.summaryStatistics.fullyMappedCount).toBe(2);
    expect(result.summaryStatistics.partiallyMappedCount).toBe(0);
    expect(result.summaryStatistics.customizationRequiredCount).toBe(0);
    expect(result.summaryStatistics.notMappedCount).toBe(0);

    expect(authModule.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectContextModule.resolveProjectContext).toHaveBeenCalled();
    expect(mappingPersistenceModule.retrieveMappingDetailsForProject).toHaveBeenCalled();
    expect(mappingPersistenceModule.retrieveMappingDetailsByTargetSystem).toHaveBeenCalled();
    expect(mappingPersistenceModule.saveMappingValidationResult).toHaveBeenCalled();
    expect(auditModule.recordMappingValidationAuditTrail).toHaveBeenCalled();
  });
});
