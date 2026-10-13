import { validateMappingAndClassifyGaps } from '../../src/logic/mapping-validation-service';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));

jest.mock('../../src/logic/mapping-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/mapping-persistence')>('../../src/logic/mapping-persistence'),
  retrieveMappingDetailsForProject: jest.fn(),
  retrieveMappingDetailsByTargetSystem: jest.fn(),
}));

jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>('../../src/logic/audit-trail-service'),
  recordMappingValidationAuditTrail: jest.fn(),
}));

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
}));

import { verifyUserAuthenticationAndAuthorization } from '../../src/logic/authentication-authorization';
import { resolveProjectContext } from '../../src/logic/project-context-resolver';
import { retrieveMappingDetailsForProject, retrieveMappingDetailsByTargetSystem } from '../../src/logic/mapping-persistence';
import { recordMappingValidationAuditTrail } from '../../src/logic/audit-trail-service';
import { createRecord } from '../../src/platform/data-store';

describe('SCEN-084: 正常系 - 各機能マッピングの推奨事項が正確に生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ギャップ分類と推奨事項が正確に生成される', async () => {
    const mockAuthResult = {
      isAuthenticated: true,
      sessionValid: true,
      userRole: 'mapping_validator',
      hasProjectAccess: true,
      permissions: ['validate_mapping', 'classify_gaps', 'generate_recommendations'],
    };

    const mockProjectContext = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      projectStatus: 'active',
      systemStatus: 'active',
      isValid: true,
    };

    const mockMappingDetails = [
      {
        id: 'mapping-001',
        sourceObjectName: 'Invoice__c',
        sourceFields: [
          { fieldName: 'InvoiceNumber__c', dataType: 'Text', required: true },
          { fieldName: 'InvoiceAmount__c', dataType: 'Currency', required: true },
          { fieldName: 'InvoiceDate__c', dataType: 'Date', required: true },
        ],
        calculationLogics: [
          { logicName: 'TotalAmount', formula: 'SUM(InvoiceLineItems__r.LineAmount__c)' },
        ],
        relationships: [
          { relationshipName: 'Account', relatedObject: 'Account', type: 'Lookup' },
          { relationshipName: 'InvoiceLineItems__r', relatedObject: 'InvoiceLineItem__c', type: 'MasterDetail' },
        ],
        businessRequirementLevel: '必須',
      },
      {
        id: 'mapping-002',
        sourceObjectName: 'InvoiceLineItem__c',
        sourceFields: [
          { fieldName: 'LineNumber__c', dataType: 'Number', required: true },
          { fieldName: 'LineAmount__c', dataType: 'Currency', required: true },
          { fieldName: 'Product__c', dataType: 'Lookup', required: false },
        ],
        calculationLogics: [],
        relationships: [
          { relationshipName: 'Invoice__c', relatedObject: 'Invoice__c', type: 'MasterDetail' },
        ],
        businessRequirementLevel: '必須',
      },
      {
        id: 'mapping-003',
        sourceObjectName: 'Account',
        sourceFields: [
          { fieldName: 'Name', dataType: 'Text', required: true },
          { fieldName: 'BillingStreet', dataType: 'Text', required: false },
        ],
        calculationLogics: [],
        relationships: [],
        businessRequirementLevel: '必須',
      },
    ];

    const mockTargetSystemCapabilities = [
      {
        featureId: 'feat-invoice-001',
        featureName: 'AR_INVOICE',
        targetFields: [
          { fieldName: 'INVOICE_NUM', dataType: 'VARCHAR2(20)', supportedLogics: ['text_match'] },
          { fieldName: 'INVOICE_AMOUNT', dataType: 'NUMBER(12,2)', supportedLogics: ['sum', 'arithmetic'] },
          { fieldName: 'INVOICE_DATE', dataType: 'DATE', supportedLogics: ['date_comparison'] },
        ],
        standardCapabilities: ['basic_invoice_creation', 'invoice_numbering', 'amount_calculation'],
        customizationAllowed: true,
        apiAvailability: true,
        customizationLimits: 3,
        dataLossRisk: false,
        performanceRisk: false,
      },
      {
        featureId: 'feat-lineitem-001',
        featureName: 'AR_INVOICE_LINE',
        targetFields: [
          { fieldName: 'LINE_NUM', dataType: 'NUMBER(3)', supportedLogics: [] },
          { fieldName: 'LINE_AMOUNT', dataType: 'NUMBER(12,2)', supportedLogics: ['arithmetic'] },
          { fieldName: 'PRODUCT_ID', dataType: 'VARCHAR2(10)', supportedLogics: ['lookup'] },
        ],
        standardCapabilities: ['line_item_creation', 'line_amount_entry'],
        customizationAllowed: true,
        apiAvailability: true,
        customizationLimits: 2,
        dataLossRisk: false,
        performanceRisk: false,
      },
      {
        featureId: 'feat-account-001',
        featureName: 'AR_CUSTOMER',
        targetFields: [
          { fieldName: 'CUST_NAME', dataType: 'VARCHAR2(100)', supportedLogics: ['text_match'] },
          { fieldName: 'CUST_ADDR', dataType: 'VARCHAR2(255)', supportedLogics: [] },
        ],
        standardCapabilities: ['customer_creation', 'customer_name_entry'],
        customizationAllowed: true,
        apiAvailability: true,
        customizationLimits: 1,
        dataLossRisk: false,
        performanceRisk: false,
      },
    ];

    (verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(mockTargetSystemCapabilities);
    (createRecord as jest.Mock).mockResolvedValue({
      validationResultId: 'vres-20240101-001',
    });
    (recordMappingValidationAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-20240101-001',
    });

    const input = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      userId: 'user-001',
      sessionId: 'session-abc123xyz',
      executionTimestamp: 1704067200000,
      mappingDetailIds: ['mapping-001', 'mapping-002', 'mapping-003'],
    };

    const result = await validateMappingAndClassifyGaps(input);

    expect(result).toBeDefined();
    expect(result.validationStatus).toBe('完了');
    expect(result.classificationResults).toHaveLength(3);

    // Verify recommendations are generated
    result.classificationResults.forEach((classification) => {
      expect(classification.recommendations).toBeDefined();
      expect(Array.isArray(classification.recommendations)).toBe(true);
    });

    // Check summary statistics
    expect(result.summaryStatistics).toBeDefined();
    expect(result.summaryStatistics.totalMappingsValidated).toBe(3);

    expect(verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(resolveProjectContext).toHaveBeenCalled();
    expect(retrieveMappingDetailsForProject).toHaveBeenCalled();
    expect(retrieveMappingDetailsByTargetSystem).toHaveBeenCalled();
    expect(createRecord).toHaveBeenCalled();
    expect(recordMappingValidationAuditTrail).toHaveBeenCalled();
  });
});
