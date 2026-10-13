import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-062: validateMappingAndClassifyGaps - 正常系：全体的なリスクレベルが判定され、summaryStatistics に分類別件数が集計される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should determine overall risk level and aggregate classification counts', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-erp',
      userId: 'user-12345',
      sessionId: 'session-abc123xyz',
      executionTimestamp: 1704067200000,
    };

    const authResult = {
      isAuthenticated: true,
      userId: 'user-12345',
      sessionId: 'session-abc123xyz',
      hasRequiredRole: true,
      hasProjectAccess: true,
    };

    const projectResult = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-erp',
      projectStatus: 'active',
      isValid: true,
    };

    const mappingDetails = [
      {
        mappingDetailId: 'map-001',
        salesforceObjectName: 'Account',
        salesforceFields: [
          { fieldName: 'Name', dataType: 'Text', isRequired: true },
          { fieldName: 'Phone', dataType: 'Phone', isRequired: false },
        ],
        calculationLogic: 'none',
        relationships: [],
      },
      {
        mappingDetailId: 'map-002',
        salesforceObjectName: 'Invoice__c',
        salesforceFields: [
          { fieldName: 'InvoiceNumber__c', dataType: 'Text', isRequired: true },
          { fieldName: 'TotalAmount__c', dataType: 'Currency', isRequired: true },
        ],
        calculationLogic: 'SUM(InvoiceLineItems__r.Amount__c)',
        relationships: [{ relationType: 'master-detail', relatedObject: 'Account' }],
      },
      {
        mappingDetailId: 'map-003',
        salesforceObjectName: 'Opportunity',
        salesforceFields: [
          { fieldName: 'Name', dataType: 'Text', isRequired: true },
          { fieldName: 'Amount', dataType: 'Currency', isRequired: false },
          { fieldName: 'StageName', dataType: 'Picklist', isRequired: true },
        ],
        calculationLogic: 'none',
        relationships: [{ relationType: 'lookup', relatedObject: 'Account' }],
      },
      {
        mappingDetailId: 'map-004',
        salesforceObjectName: 'InvoiceLineItem__c',
        salesforceFields: [
          { fieldName: 'LineItemAmount__c', dataType: 'Currency', isRequired: true },
          { fieldName: 'Quantity__c', dataType: 'Number', isRequired: true },
        ],
        calculationLogic: 'Quantity__c * UnitPrice__c',
        relationships: [{ relationType: 'master-detail', relatedObject: 'Invoice__c' }],
      },
    ];

    const targetCapabilities = [
      {
        targetSystemCapabilityId: 'cap-001',
        targetObjectName: 'CUSTOMERS',
        targetFields: [
          { fieldName: 'CUSTOMER_NAME', dataType: 'VARCHAR2(255)', isNullable: false },
          { fieldName: 'PHONE', dataType: 'VARCHAR2(20)', isNullable: true },
        ],
        calculationCapability: 'none',
        extensibility: 'API_AVAILABLE',
      },
      {
        targetSystemCapabilityId: 'cap-002',
        targetObjectName: 'INVOICES',
        targetFields: [
          { fieldName: 'INVOICE_ID', dataType: 'NUMBER', isNullable: false },
          { fieldName: 'INVOICE_TOTAL', dataType: 'NUMBER(15,2)', isNullable: false },
          { fieldName: 'CUSTOMER_ID', dataType: 'NUMBER', isNullable: false },
        ],
        calculationCapability: 'SUM_AGGREGATE_SUPPORTED',
        extensibility: 'API_AVAILABLE',
      },
      {
        targetSystemCapabilityId: 'cap-003',
        targetObjectName: 'ORDERS',
        targetFields: [
          { fieldName: 'ORDER_NAME', dataType: 'VARCHAR2(255)', isNullable: false },
          { fieldName: 'ORDER_AMOUNT', dataType: 'NUMBER(15,2)', isNullable: true },
          { fieldName: 'ORDER_STATUS', dataType: 'VARCHAR2(50)', isNullable: false },
        ],
        calculationCapability: 'none',
        extensibility: 'API_AVAILABLE',
      },
      {
        targetSystemCapabilityId: 'cap-004',
        targetObjectName: 'INVOICE_LINES',
        targetFields: [
          { fieldName: 'LINE_AMOUNT', dataType: 'NUMBER(15,2)', isNullable: false },
          { fieldName: 'QUANTITY', dataType: 'NUMBER', isNullable: false },
          { fieldName: 'INVOICE_ID', dataType: 'NUMBER', isNullable: false },
        ],
        calculationCapability: 'FORMULA_CALCULATION_SUPPORTED',
        extensibility: 'API_AVAILABLE',
      },
    ];

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);
    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue(projectResult);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsForProject).mockResolvedValue(mappingDetails);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsByTargetSystem).mockResolvedValue(targetCapabilities);
    jest.mocked(mappingPersistenceModule.saveMappingValidationResult).mockResolvedValue({ resultId: 'val-result-001', saved: true });
    jest.mocked(auditModule.recordMappingValidationAuditTrail).mockResolvedValue({ auditTrailId: 'audit-001', recorded: true });

    const result = await validateMappingAndClassifyGaps(input);

    expect(result.validationResultId).toBe('val-result-001');
    expect(result.projectId).toBe('proj-001');
    expect(result.targetSystemId).toBe('sys-oracle-erp');
    expect(result.validationStatus).toBe('完了');
    expect(result.validationTimestamp).toBe(1704067200000);
    expect(result.classificationResults).toHaveLength(4);
    expect(result.overallRiskLevel).toBe('低');
    expect(result.summaryStatistics.fullyMappedCount).toBe(2);
    expect(result.summaryStatistics.partiallyMappedCount).toBe(2);
    expect(result.summaryStatistics.customizationRequiredCount).toBe(0);
    expect(result.summaryStatistics.notMappedCount).toBe(0);
  });
});
