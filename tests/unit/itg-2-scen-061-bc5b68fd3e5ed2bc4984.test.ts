import { validateMappingAndClassifyGaps } from '../../src/logic/mapping-validation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectResolver from '../../src/logic/project-context-resolver';
import * as mappingPersistence from '../../src/logic/mapping-persistence';
import * as auditService from '../../src/logic/audit-trail-service';

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
  saveMappingValidationResult: jest.fn(),
  recordOperationAuditTrail: jest.fn(),
}));

jest.mock('../../src/logic/audit-trail-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/audit-trail-service')>('../../src/logic/audit-trail-service'),
  recordMappingValidationAuditTrail: jest.fn(),
}));

describe('SCEN-061: Salesforceの請求書・請求明細カスタムオブジェクト構造と移行対象システムの標準機能を対比し、各営業プロセス段階の実現可能性が正確に評価される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate mapping and classify gaps with correct gap categories, gap scores, and risk level', async () => {
    const input = {
      projectId: 'proj-20250107-001',
      targetSystemId: 'target-sys-oracle-erp-001',
      userId: 'user-migration-lead-001',
      sessionId: 'session-valid-20250107-12345',
      executionTimestamp: 1704630000000,
      mappingDetailIds: undefined,
    };

    const mockAuthResult = {
      isAuthorized: true,
      userId: 'user-migration-lead-001',
      operationType: 'validate_mapping',
      projectId: 'proj-20250107-001',
      denialReason: null,
    };

    const mockProjectContext = {
      projectId: 'proj-20250107-001',
      targetSystemId: 'target-sys-oracle-erp-001',
      projectStatus: 'active',
      projectName: 'Salesforce to Oracle ERP Migration',
      targetSystemName: 'Oracle ERP Standard Edition',
      isValid: true,
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'map-detail-001',
        mappingName: 'Account to Customer Master',
        salesforceObjectName: 'Account',
        salesforceFields: [
          { fieldName: 'Name', dataType: 'Text', required: true, calculationLogic: null },
          { fieldName: 'BillingCity', dataType: 'Text', required: false, calculationLogic: null },
          { fieldName: 'Industry', dataType: 'Picklist', required: false, calculationLogic: null },
        ],
        calculationFormulas: [],
        objectRelationships: [{ relationshipName: 'Contacts', relatedObject: 'Contact', relationshipType: 'OneToMany' }],
        processStageMapping: 'prospecting_stage',
      },
      {
        mappingDetailId: 'map-detail-002',
        mappingName: 'Invoice Custom Object to Oracle Receivables',
        salesforceObjectName: 'Invoice__c',
        salesforceFields: [
          { fieldName: 'InvoiceNumber__c', dataType: 'Text', required: true, calculationLogic: null },
          { fieldName: 'InvoiceAmount__c', dataType: 'Currency', required: true, calculationLogic: null },
          { fieldName: 'TotalLineAmount__c', dataType: 'Currency', required: false, calculationLogic: 'SUM(InvoiceLineItems__r.LineAmount__c)' },
          { fieldName: 'InvoiceDate__c', dataType: 'Date', required: true, calculationLogic: null },
          { fieldName: 'DueDate__c', dataType: 'Date', required: true, calculationLogic: 'InvoiceDate__c + 30' },
        ],
        calculationFormulas: [
          { formulaName: 'TotalLineAmount__c', formulaExpression: 'SUM(InvoiceLineItems__r.LineAmount__c)', dataType: 'Currency', complexity: 'medium' },
        ],
        objectRelationships: [
          { relationshipName: 'Account', relatedObject: 'Account', relationshipType: 'MasterDetail' },
          { relationshipName: 'InvoiceLineItems__r', relatedObject: 'InvoiceLine__c', relationshipType: 'OneToMany' },
        ],
        processStageMapping: 'billing_stage',
      },
      {
        mappingDetailId: 'map-detail-003',
        mappingName: 'InvoiceLine Custom Object to Oracle Receivables Lines',
        salesforceObjectName: 'InvoiceLine__c',
        salesforceFields: [
          { fieldName: 'LineNumber__c', dataType: 'Number', required: true, calculationLogic: null },
          { fieldName: 'Description__c', dataType: 'Text', required: true, calculationLogic: null },
          { fieldName: 'Quantity__c', dataType: 'Number', required: true, calculationLogic: null },
          { fieldName: 'UnitPrice__c', dataType: 'Currency', required: true, calculationLogic: null },
          { fieldName: 'LineAmount__c', dataType: 'Currency', required: false, calculationLogic: 'Quantity__c * UnitPrice__c' },
        ],
        calculationFormulas: [
          { formulaName: 'LineAmount__c', formulaExpression: 'Quantity__c * UnitPrice__c', dataType: 'Currency', complexity: 'low' },
        ],
        objectRelationships: [{ relationshipName: 'Invoice__c', relatedObject: 'Invoice__c', relationshipType: 'MasterDetail' }],
        processStageMapping: 'billing_line_stage',
      },
    ];

    const mockTargetCapabilities = [
      {
        capabilityId: 'cap-oracle-001',
        featureName: 'Customer Master',
        targetObject: 'HZ_PARTIES',
        targetFields: [
          { fieldName: 'PARTY_NAME', dataType: 'VARCHAR2', supported: true, required: true },
          { fieldName: 'CITY', dataType: 'VARCHAR2', supported: true, required: false },
          { fieldName: 'INDUSTRY_CODE', dataType: 'VARCHAR2', supported: true, required: false },
        ],
        calculationCapabilities: { supportedTypes: ['sum', 'count', 'average'], complexity: 'low' },
        relationshipSupport: true,
        extensibility: 'api_available',
        apiLimitations: 'StandardEdition',
      },
      {
        capabilityId: 'cap-oracle-002',
        featureName: 'Oracle Receivables - Invoice Header',
        targetObject: 'RA_CUSTOMER_TRX',
        targetFields: [
          { fieldName: 'TRX_NUMBER', dataType: 'VARCHAR2', supported: true, required: true },
          { fieldName: 'AMOUNT_TOTAL', dataType: 'NUMBER', supported: true, required: true },
          { fieldName: 'LINE_AMOUNT_TOTAL', dataType: 'NUMBER', supported: true, required: false },
          { fieldName: 'TRX_DATE', dataType: 'DATE', supported: true, required: true },
          { fieldName: 'DUE_DATE', dataType: 'DATE', supported: true, required: true },
        ],
        calculationCapabilities: { supportedTypes: ['sum', 'custom_field'], complexity: 'medium' },
        relationshipSupport: true,
        extensibility: 'custom_fields_available',
        apiLimitations: 'StandardEdition',
      },
      {
        capabilityId: 'cap-oracle-003',
        featureName: 'Oracle Receivables - Invoice Line',
        targetObject: 'RA_CUSTOMER_TRX_LINES',
        targetFields: [
          { fieldName: 'LINE_NUMBER', dataType: 'NUMBER', supported: true, required: true },
          { fieldName: 'DESCRIPTION', dataType: 'VARCHAR2', supported: true, required: true },
          { fieldName: 'QUANTITY', dataType: 'NUMBER', supported: true, required: true },
          { fieldName: 'UNIT_PRICE', dataType: 'NUMBER', supported: true, required: true },
          { fieldName: 'LINE_AMOUNT', dataType: 'NUMBER', supported: true, required: false },
        ],
        calculationCapabilities: { supportedTypes: ['arithmetic', 'sum'], complexity: 'low' },
        relationshipSupport: true,
        extensibility: 'custom_fields_available',
        apiLimitations: 'StandardEdition',
      },
    ];

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (projectResolver.resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (mappingPersistence.retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(mockTargetCapabilities);

    const savedValidationResultIds = ['validation-result-001', 'validation-result-002', 'validation-result-003'];
    const savedAuditTrailId = 'audit-trail-001';

    (mappingPersistence.saveMappingValidationResult as jest.Mock)
      .mockResolvedValueOnce({ validationResultId: savedValidationResultIds[0] })
      .mockResolvedValueOnce({ validationResultId: savedValidationResultIds[1] })
      .mockResolvedValueOnce({ validationResultId: savedValidationResultIds[2] });

    (auditService.recordMappingValidationAuditTrail as jest.Mock).mockResolvedValue({ auditTrailId: savedAuditTrailId });

    const result = await validateMappingAndClassifyGaps(input);

    expect(result).toBeDefined();
    expect(result.validationResultId).toBeDefined();
    expect(result.projectId).toBe('proj-20250107-001');
    expect(result.targetSystemId).toBe('target-sys-oracle-erp-001');
    expect(result.validationStatus).toBe('completed');
    expect(result.validationTimestamp).toBeGreaterThanOrEqual(1704630000000);

    expect(result.classificationResults).toHaveLength(3);

    const account = result.classificationResults[0];
    expect(account.mappingDetailId).toBe('map-detail-001');
    expect(account.gapCategory).toBe('fully_compatible');
    expect(account.gapScore).toBe(0);

    const invoice = result.classificationResults[1];
    expect(invoice.mappingDetailId).toBe('map-detail-002');
    expect(invoice.gapCategory).toBe('partially_compatible');
    expect(invoice.gapScore).toBe(35);

    const invoiceLine = result.classificationResults[2];
    expect(invoiceLine.mappingDetailId).toBe('map-detail-003');
    expect(invoiceLine.gapCategory).toBe('fully_compatible');
    expect(invoiceLine.gapScore).toBe(0);

    expect(result.overallRiskLevel).toBe('medium');

    expect(result.summaryStatistics).toBeDefined();
    expect(result.summaryStatistics.totalMappingsValidated).toBe(3);
    expect(result.summaryStatistics.fullyMappedCount).toBe(2);
    expect(result.summaryStatistics.partiallyMappedCount).toBe(1);
    expect(result.summaryStatistics.customizationRequiredCount).toBe(1);
    expect(result.summaryStatistics.notMappedCount).toBe(0);
    expect(result.summaryStatistics.averageGapScore).toBeCloseTo(11.67, 1);

    expect(authService.verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(projectResolver.resolveProjectContext).toHaveBeenCalled();
    expect(mappingPersistence.retrieveMappingDetailsForProject).toHaveBeenCalled();
    expect(mappingPersistence.saveMappingValidationResult).toHaveBeenCalledTimes(3);
    expect(auditService.recordMappingValidationAuditTrail).toHaveBeenCalled();
  });
});
