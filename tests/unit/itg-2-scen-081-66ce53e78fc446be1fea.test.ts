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

describe('SCEN-081: 営業プロセスフロー定義の曖昧性がある場合、警告メッセージが生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('プロセスフロー定義に依存関係の曖昧性がある場合、警告メッセージを含む', async () => {
    const mockAuthResult = {
      isAuthenticated: true,
      userRole: 'mapping_validator',
      hasProjectAccess: true,
      canExecuteValidation: true,
    };

    const mockProjectContext = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      projectStatus: 'active',
      systemStatus: 'active',
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'map-detail-001',
        processStage: '取引先',
        salesforceObjectName: 'Account',
        salesforceFieldName: 'Name',
        targetSystemFieldName: 'CUSTOMER_NAME',
        calculationLogic: null,
        dependencies: [],
      },
      {
        mappingDetailId: 'map-detail-002',
        processStage: '責任者',
        salesforceObjectName: 'Contact',
        salesforceFieldName: 'Email',
        targetSystemFieldName: 'CONTACT_EMAIL',
        calculationLogic: null,
        dependencies: ['map-detail-001'],
      },
      {
        mappingDetailId: 'map-detail-003',
        processStage: '活動',
        salesforceObjectName: 'Task',
        salesforceFieldName: 'ActivityDate',
        targetSystemFieldName: 'ACTIVITY_DT',
        calculationLogic: null,
        dependencies: ['map-detail-002'],
      },
      {
        mappingDetailId: 'map-detail-004',
        processStage: '商談',
        salesforceObjectName: 'Opportunity',
        salesforceFieldName: 'Amount',
        targetSystemFieldName: 'ORDER_AMOUNT',
        calculationLogic: null,
        dependencies: ['map-detail-001'],
      },
      {
        mappingDetailId: 'map-detail-005',
        processStage: '請求',
        salesforceObjectName: 'Invoice__c',
        salesforceFieldName: 'InvoiceAmount__c',
        targetSystemFieldName: null,
        calculationLogic: 'SUM(Line_Item_Amount__c)',
        dependencies: [],
      },
    ];

    const mockTargetSystemCapabilities = {
      standardFeatures: [
        {
          featureName: 'CUSTOMER_MANAGEMENT',
          supportsField: 'CUSTOMER_NAME',
          dataType: 'VARCHAR2(100)',
          customizable: true,
        },
        {
          featureName: 'CONTACT_MANAGEMENT',
          supportsField: 'CONTACT_EMAIL',
          dataType: 'VARCHAR2(100)',
          customizable: true,
        },
        {
          featureName: 'ACTIVITY_TRACKING',
          supportsField: 'ACTIVITY_DT',
          dataType: 'DATE',
          customizable: true,
        },
        {
          featureName: 'ORDER_MANAGEMENT',
          supportsField: 'ORDER_AMOUNT',
          dataType: 'NUMBER(12,2)',
          customizable: true,
        },
      ],
      billingFeature: {
        supportsInvoicing: true,
        standardFields: ['INVOICE_NO', 'INVOICE_DT', 'CUSTOMER_ID'],
        calculationCapability: 'limited',
        customizationAvailable: true,
      },
    };

    (verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(mockTargetSystemCapabilities);
    (createRecord as jest.Mock).mockResolvedValue({
      validationResultId: 'val-result-20260107-001',
    });
    (recordMappingValidationAuditTrail as jest.Mock).mockResolvedValue({
      auditId: 'audit-20260107-001',
    });

    const input = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      userId: 'user-sales-mgr-001',
      sessionId: 'sess-valid-20260107-001',
      executionTimestamp: 1704902400000,
      mappingDetailIds: undefined,
    };

    const result = await validateMappingAndClassifyGaps(input);

    expect(result).toBeDefined();
    expect(result.validationStatus).toMatch(/完了|部分完了/);

    // Check for process flow warning
    const invoiceResult = result.classificationResults.find(
      (r) => r.mappingDetailId === 'map-detail-005'
    );

    expect(invoiceResult).toBeDefined();
    expect(invoiceResult?.recommendations.some((r) =>
      r.includes('プロセスフロー定義を確認し、各段階の依存関係を明確にしてください')
    )).toBeTruthy();
  });
});
