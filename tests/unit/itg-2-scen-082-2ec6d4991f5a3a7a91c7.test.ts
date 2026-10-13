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

describe('SCEN-082: 正常系 - 検証ステータスが正確に記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('完全に対応するマッピングの場合、validationStatus が完了と記録される', async () => {
    const mockAuthResult = {
      isAuthenticated: true,
      userId: 'user-migration-lead',
      role: 'migration_lead',
      hasPermission: true,
      projectAccess: ['proj-001'],
    };

    const mockProjectContext = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      projectStatus: 'active',
      systemStatus: 'initialized',
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'mapping-001',
        projectId: 'proj-001',
        salesforceObjectName: 'Invoice__c',
        targetObjectName: 'AR_INVOICES',
        fieldMappings: [
          { sfField: 'InvoiceNumber__c', targetField: 'INVOICE_NUMBER', dataType: 'Text', isMandatory: true },
          { sfField: 'InvoiceAmount__c', targetField: 'INVOICE_AMOUNT', dataType: 'Number', isMandatory: true },
        ],
        calculationLogic: 'SUM(InvoiceLineItems__r.Amount__c)',
        references: ['InvoiceLineItems__c'],
        businessRequirementLevel: '必須',
      },
      {
        mappingDetailId: 'mapping-002',
        projectId: 'proj-001',
        salesforceObjectName: 'InvoiceLineItem__c',
        targetObjectName: 'AR_INVOICE_LINES',
        fieldMappings: [
          { sfField: 'LineItemDescription__c', targetField: 'LINE_DESCRIPTION', dataType: 'Text', isMandatory: true },
          { sfField: 'Quantity__c', targetField: 'QUANTITY', dataType: 'Number', isMandatory: true },
          { sfField: 'UnitPrice__c', targetField: 'UNIT_PRICE', dataType: 'Currency', isMandatory: true },
        ],
        calculationLogic: 'Quantity__c * UnitPrice__c',
        references: ['Invoice__c'],
        businessRequirementLevel: '必須',
      },
      {
        mappingDetailId: 'mapping-003',
        projectId: 'proj-001',
        salesforceObjectName: 'Opportunity',
        targetObjectName: 'SALES_OPPORTUNITIES',
        fieldMappings: [
          { sfField: 'StageName', targetField: 'OPPORTUNITY_STAGE', dataType: 'Picklist', isMandatory: false },
          { sfField: 'Amount', targetField: 'OPPORTUNITY_AMOUNT', dataType: 'Currency', isMandatory: true },
        ],
        calculationLogic: null,
        references: [],
        businessRequirementLevel: '推奨',
      },
    ];

    const mockTargetSystemCapabilities = [
      {
        targetSystemId: 'sys-oracle-001',
        targetObjectName: 'AR_INVOICES',
        standardCapabilities: {
          fields: [
            { fieldName: 'INVOICE_NUMBER', dataType: 'VARCHAR2', length: 50, nullable: false },
            { fieldName: 'INVOICE_AMOUNT', dataType: 'NUMBER', precision: 15, scale: 2, nullable: false },
          ],
          calculationSupport: 'PLSQL_FORMULAS',
          referenceSupport: true,
          apiAvailability: true,
          customizationLimits: 100,
        },
      },
      {
        targetSystemId: 'sys-oracle-001',
        targetObjectName: 'AR_INVOICE_LINES',
        standardCapabilities: {
          fields: [
            { fieldName: 'LINE_DESCRIPTION', dataType: 'VARCHAR2', length: 500, nullable: false },
            { fieldName: 'QUANTITY', dataType: 'NUMBER', precision: 12, scale: 2, nullable: false },
            { fieldName: 'UNIT_PRICE', dataType: 'NUMBER', precision: 12, scale: 2, nullable: false },
          ],
          calculationSupport: 'PLSQL_FORMULAS',
          referenceSupport: true,
          apiAvailability: true,
          customizationLimits: 100,
        },
      },
      {
        targetSystemId: 'sys-oracle-001',
        targetObjectName: 'SALES_OPPORTUNITIES',
        standardCapabilities: {
          fields: [
            { fieldName: 'OPPORTUNITY_STAGE', dataType: 'VARCHAR2', length: 50, nullable: true },
            { fieldName: 'OPPORTUNITY_AMOUNT', dataType: 'NUMBER', precision: 15, scale: 2, nullable: false },
          ],
          calculationSupport: 'LIMITED',
          referenceSupport: true,
          apiAvailability: true,
          customizationLimits: 50,
        },
      },
    ];

    (verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(mockTargetSystemCapabilities);
    (createRecord as jest.Mock).mockResolvedValue({
      validationResultId: 'validation-result-20240101-001',
    });
    (recordMappingValidationAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-20240101-001',
    });

    const input = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      userId: 'user-migration-lead',
      sessionId: 'session-abc123def456',
      executionTimestamp: 1704067200000,
      mappingDetailIds: ['mapping-001', 'mapping-002', 'mapping-003'],
    };

    const result = await validateMappingAndClassifyGaps(input);

    expect(result).toBeDefined();
    expect(result.validationStatus).toBe('完了');
    expect(result.validationResultId).toBe('validation-result-20240101-001');
    expect(result.projectId).toBe('proj-001');
    expect(result.targetSystemId).toBe('sys-oracle-001');
    expect(result.validationTimestamp).toBe(1704067200000);
    expect(result.classificationResults).toHaveLength(3);
    expect(result.overallRiskLevel).toBeDefined();

    expect(verifyUserAuthenticationAndAuthorization).toHaveBeenCalled();
    expect(resolveProjectContext).toHaveBeenCalled();
    expect(retrieveMappingDetailsForProject).toHaveBeenCalled();
    expect(retrieveMappingDetailsByTargetSystem).toHaveBeenCalled();
    expect(createRecord).toHaveBeenCalled();
    expect(recordMappingValidationAuditTrail).toHaveBeenCalled();
  });
});
