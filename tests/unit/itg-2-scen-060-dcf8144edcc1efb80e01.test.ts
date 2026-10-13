import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-060: validateMappingAndClassifyGaps - 正常系：検証結果の分類が正確に分類されギャップスコアが0～100で算出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should classify gaps accurately and calculate scores from 0-100', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-001',
      targetSystemId: 'tgt-sys-001',
      userId: 'user-001',
      sessionId: 'session-token-abc123',
      executionTimestamp: 1700000000000,
      mappingDetailIds: ['map-detail-001', 'map-detail-002', 'map-detail-003'],
    };

    const authResult = {
      userId: 'user-001',
      authenticated: true,
      sessionValid: true,
      permissions: ['MAPPING_VALIDATOR', 'MAPPING_REVIEWER'],
      auditTrailEnabled: true,
    };

    const projectResult = {
      projectId: 'proj-001',
      targetSystemId: 'tgt-sys-001',
    };

    const mappingDetails = [
      {
        mappingDetailId: 'map-detail-001',
        salesforceObjectName: 'Invoice__c',
        fields: [
          { fieldName: 'InvoiceNumber__c', dataType: 'Text', required: true, calculationLogic: null },
          { fieldName: 'Amount__c', dataType: 'Currency', required: true, calculationLogic: 'SUM(InvoiceLineItems__r.Amount__c)' },
        ],
        relationships: [{ relationshipName: 'Opportunity__r', relatedObject: 'Opportunity', type: 'Lookup' }],
        businessRequirementLevel: '必須',
      },
      {
        mappingDetailId: 'map-detail-002',
        salesforceObjectName: 'InvoiceLineItem__c',
        fields: [
          { fieldName: 'LineItemNumber__c', dataType: 'Text', required: true, calculationLogic: null },
          { fieldName: 'Quantity__c', dataType: 'Number', required: true, calculationLogic: null },
          { fieldName: 'UnitPrice__c', dataType: 'Currency', required: true, calculationLogic: null },
        ],
        relationships: [{ relationshipName: 'Invoice__r', relatedObject: 'Invoice__c', type: 'Master-Detail' }],
        businessRequirementLevel: '必須',
      },
      {
        mappingDetailId: 'map-detail-003',
        salesforceObjectName: 'Opportunity',
        fields: [
          { fieldName: 'Name', dataType: 'Text', required: true, calculationLogic: null },
          { fieldName: 'Amount', dataType: 'Currency', required: false, calculationLogic: null },
        ],
        relationships: [{ relationshipName: 'Account', relatedObject: 'Account', type: 'Lookup' }],
        businessRequirementLevel: '必須',
      },
    ];

    const targetCapabilities = [
      {
        capabilityId: 'cap-001',
        targetObjectName: 'INVOICES',
        standardFields: [
          { fieldName: 'INVOICE_NUMBER', dataType: 'VARCHAR2(50)', supported: true },
          { fieldName: 'TOTAL_AMOUNT', dataType: 'NUMBER(15,2)', supported: true, calculationCapability: 'DATABASE_FUNCTION' },
        ],
        relationships: [{ relationshipName: 'OPPORTUNITIES', targetObject: 'OPPORTUNITIES', type: 'FOREIGN_KEY', supported: true }],
        customizationConstraints: { api_availability: true, customization_limits: 5, extensionCapability: 'MODERATE' },
      },
      {
        capabilityId: 'cap-002',
        targetObjectName: 'INVOICE_LINES',
        standardFields: [
          { fieldName: 'LINE_NUMBER', dataType: 'VARCHAR2(20)', supported: true },
          { fieldName: 'QUANTITY', dataType: 'NUMBER(12,2)', supported: true },
          { fieldName: 'UNIT_PRICE', dataType: 'NUMBER(15,2)', supported: true },
        ],
        relationships: [{ relationshipName: 'INVOICES', targetObject: 'INVOICES', type: 'FOREIGN_KEY', supported: true }],
        customizationConstraints: { api_availability: true, customization_limits: 3, extensionCapability: 'MODERATE' },
      },
      {
        capabilityId: 'cap-003',
        targetObjectName: 'OPPORTUNITIES',
        standardFields: [
          { fieldName: 'NAME', dataType: 'VARCHAR2(255)', supported: true },
          { fieldName: 'VALUE', dataType: 'NUMBER(15,2)', supported: true },
        ],
        relationships: [{ relationshipName: 'ACCOUNTS', targetObject: 'ACCOUNTS', type: 'FOREIGN_KEY', supported: true }],
        customizationConstraints: { api_availability: true, customization_limits: 4, extensionCapability: 'HIGH' },
      },
    ];

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);
    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue(projectResult);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsForProject).mockResolvedValue(mappingDetails);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsByTargetSystem).mockResolvedValue(targetCapabilities);
    jest.mocked(mappingPersistenceModule.saveMappingValidationResult).mockResolvedValue({ validationResultId: 'vr-001' });
    jest.mocked(auditModule.recordMappingValidationAuditTrail).mockResolvedValue({});

    const result = await validateMappingAndClassifyGaps(input);

    expect(result.validationResultId).toBe('vr-001');
    expect(result.projectId).toBe('proj-001');
    expect(result.targetSystemId).toBe('tgt-sys-001');
    expect(result.validationStatus).toBe('完了');
    expect(result.validationTimestamp).toBe(1700000000000);
    expect(result.classificationResults).toHaveLength(3);

    expect(result.classificationResults[0].gapCategory).toBe('完全対応');
    expect(result.classificationResults[0].gapScore).toBe(5);
    expect(result.classificationResults[1].gapCategory).toBe('完全対応');
    expect(result.classificationResults[1].gapScore).toBe(3);
    expect(result.classificationResults[2].gapCategory).toBe('部分対応');
    expect(result.classificationResults[2].gapScore).toBe(15);

    expect(result.classificationResults.every((r: any) => r.gapScore >= 0 && r.gapScore <= 100)).toBe(true);
    expect(result.overallRiskLevel).toBe('低');
    expect(result.summaryStatistics.fullyMappedCount).toBe(2);
    expect(result.summaryStatistics.partiallyMappedCount).toBe(1);
    expect(result.summaryStatistics.customizationRequiredCount).toBe(0);
    expect(result.summaryStatistics.notMappedCount).toBe(0);
  });
});
