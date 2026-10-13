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

describe('SCEN-083: 正常系 - validationTimestamp が executionTimestamp と一致して記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validationTimestamp が executionTimestamp 値と一致する', async () => {
    const mockAuthResult = {
      isAuthenticated: true,
      userId: 'user-migration-lead-001',
      sessionId: 'session-valid-20260110',
      role: 'MigrationLead',
      hasPermission: true,
      projectAccessLevel: 'full',
    };

    const mockProjectContext = {
      projectId: 'proj-migration-001',
      targetSystemId: 'target-erp-oracle',
      projectStatus: 'active',
      isValidContext: true,
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'mapping-detail-001',
        salesforceObjectName: 'Invoice__c',
        targetSystemObjectName: 'AR_INVOICES',
        fieldMappings: [
          { sfField: 'InvoiceNumber__c', targetField: 'invoice_number', matchingLevel: '完全対応' },
          { sfField: 'InvoiceAmount__c', targetField: 'invoice_total_amount', matchingLevel: '完全対応' },
        ],
        calculationLogic: 'SUM(InvoiceLineItems__r.LineAmount__c)',
        references: ['Account', 'Opportunity'],
        isValid: true,
      },
      {
        mappingDetailId: 'mapping-detail-002',
        salesforceObjectName: 'InvoiceLineItem__c',
        targetSystemObjectName: 'AR_INVOICE_LINES',
        fieldMappings: [
          { sfField: 'LineAmount__c', targetField: 'line_amount', matchingLevel: '完全対応' },
          { sfField: 'Quantity__c', targetField: 'quantity', matchingLevel: '完全対応' },
          { sfField: 'UnitPrice__c', targetField: 'unit_price', matchingLevel: '完全対応' },
        ],
        calculationLogic: 'Quantity__c * UnitPrice__c',
        references: ['Invoice__c', 'Product2'],
        isValid: true,
      },
      {
        mappingDetailId: 'mapping-detail-003',
        salesforceObjectName: 'Account',
        targetSystemObjectName: 'AR_CUSTOMERS',
        fieldMappings: [
          { sfField: 'Name', targetField: 'customer_name', matchingLevel: '完全対応' },
          { sfField: 'BillingStreet', targetField: 'billing_address', matchingLevel: '部分対応' },
        ],
        calculationLogic: null,
        references: [],
        isValid: true,
      },
    ];

    const mockTargetSystemCapabilities = {
      targetSystemId: 'target-erp-oracle',
      standardFeatures: [
        {
          featureName: 'invoice_management',
          supportedFields: ['invoice_number', 'invoice_total_amount', 'customer_id'],
          calculationCapability: 'SUM_AGGREGATION',
          apiAvailability: true,
          customizationLimits: 10,
        },
        {
          featureName: 'invoice_line_management',
          supportedFields: ['line_amount', 'quantity', 'unit_price', 'product_id'],
          calculationCapability: 'ARITHMETIC_OPERATIONS',
          apiAvailability: true,
          customizationLimits: 10,
        },
        {
          featureName: 'customer_master',
          supportedFields: ['customer_name', 'customer_id'],
          calculationCapability: 'NONE',
          apiAvailability: true,
          customizationLimits: 5,
        },
      ],
      isAvailable: true,
    };

    (verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(mockTargetSystemCapabilities);
    (createRecord as jest.Mock).mockResolvedValue({
      validationResultId: 'validation-result-20260110-001',
    });
    (recordMappingValidationAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-20260110-001',
    });

    const executionTimestamp = 1735425600000;
    const input = {
      projectId: 'proj-migration-001',
      targetSystemId: 'target-erp-oracle',
      userId: 'user-migration-lead-001',
      sessionId: 'session-valid-20260110',
      executionTimestamp,
      mappingDetailIds: ['mapping-detail-001', 'mapping-detail-002', 'mapping-detail-003'],
    };

    const result = await validateMappingAndClassifyGaps(input);

    expect(result).toBeDefined();
    expect(result.validationStatus).toBe('完了');
    expect(result.validationTimestamp).toBe(executionTimestamp);
    expect(result.classificationResults).toHaveLength(3);
  });
});
