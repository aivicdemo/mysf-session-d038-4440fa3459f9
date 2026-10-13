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

describe('SCEN-078: カスタマイズ工数が大かつ予算制約がある場合、代替案検討推奨メッセージが生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('complexity が大、remainingBudget が限定的な場合、警告メッセージ「別の移行対象システムの検討も推奨します」を含む', async () => {
    const mockAuthResult = {
      isAuthenticated: true,
      userId: 'user-pm-001',
      roles: ['PROJECT_MANAGER', 'MAPPING_VALIDATOR'],
      hasAccessToProject: true,
    };

    const mockProjectContext = {
      projectId: 'proj-salesforce-migration-001',
      targetSystemId: 'target-oracle-erp-001',
      projectStatus: 'active',
      budgetConstraint: 500000,
      remainingBudget: 150000,
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'mapping-invoice-header-001',
        mappingName: '請求書ヘッダー',
        salesforceObjectName: 'Invoice__c',
        businessRequirementLevel: '推奨',
        salesforceFields: [
          { fieldName: 'InvoiceNumber__c', dataType: 'Text', required: true },
          { fieldName: 'InvoiceAmount__c', dataType: 'Currency', required: true },
          { fieldName: 'InvoiceDate__c', dataType: 'Date', required: true },
        ],
        calculationLogic: '複数の請求明細行の合計金額を自動計算',
        referenceRelationships: [
          { targetObject: 'Account', relationshipType: 'lookup' },
          { targetObject: 'InvoiceLine__c', relationshipType: 'master-detail' },
        ],
      },
      {
        mappingDetailId: 'mapping-invoice-line-001',
        mappingName: '請求明細行',
        salesforceObjectName: 'InvoiceLine__c',
        businessRequirementLevel: '必須',
        salesforceFields: [
          { fieldName: 'LineAmount__c', dataType: 'Currency', required: true },
          { fieldName: 'Quantity__c', dataType: 'Number', required: true },
          { fieldName: 'UnitPrice__c', dataType: 'Currency', required: true },
          { fieldName: 'TaxAmount__c', dataType: 'Currency', required: false },
        ],
        calculationLogic: '複雑な税計算（複数税率対応、地域別税率参照）、割引ロジック',
        referenceRelationships: [
          { targetObject: 'Invoice__c', relationshipType: 'master-detail' },
          { targetObject: 'Product2', relationshipType: 'lookup' },
        ],
      },
    ];

    const mockTargetSystemCapabilities = [
      {
        targetSystemFeatureId: 'oracle-ar-invoice-001',
        featureName: 'Oracle AR請求書',
        targetSystemObjectName: 'RA_CUSTOMER_TRX',
        standardFields: [
          { fieldName: 'TRX_NUMBER', dataType: 'VARCHAR2', required: true },
          { fieldName: 'TRX_AMOUNT', dataType: 'NUMBER', required: true },
          { fieldName: 'TRX_DATE', dataType: 'DATE', required: true },
        ],
        calculationCapabilities: '基本的な金額計算のみ',
        extensibility: {
          apiAvailable: true,
          customizationLimits: 'カスタマイズ可能だがコア機能への影響回避',
        },
        complexity: '中',
      },
      {
        targetSystemFeatureId: 'oracle-ar-line-001',
        featureName: 'Oracle AR請求明細行',
        targetSystemObjectName: 'RA_CUSTOMER_TRX_LINES',
        standardFields: [
          { fieldName: 'LINE_NUMBER', dataType: 'NUMBER', required: true },
          { fieldName: 'QUANTITY_ORDERED', dataType: 'NUMBER', required: true },
          { fieldName: 'UNIT_SELLING_PRICE', dataType: 'NUMBER', required: true },
        ],
        calculationCapabilities: '単純な数量×単価計算のみ',
        extensibility: {
          apiAvailable: true,
          customizationLimits: 'PL/SQLによるロジック追加は可だが、デリバリー工数が大',
        },
        complexity: '大',
      },
    ];

    (verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(mockTargetSystemCapabilities);
    (createRecord as jest.Mock).mockResolvedValue({
      validationResultId: 'val-result-20260110-001',
    });
    (recordMappingValidationAuditTrail as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-20260110-001',
    });

    const input = {
      projectId: 'proj-salesforce-migration-001',
      targetSystemId: 'target-oracle-erp-001',
      userId: 'user-pm-001',
      sessionId: 'session-valid-20260110',
      executionTimestamp: 1673395200000,
      mappingDetailIds: ['mapping-invoice-header-001', 'mapping-invoice-line-001'],
    };

    const result = await validateMappingAndClassifyGaps(input);

    expect(result).toBeDefined();
    expect(result.validationStatus).toBe('完了');

    // Check for warning message related to customization effort and budget constraint
    const lineItemResult = result.classificationResults.find(
      (r) => r.mappingDetailId === 'mapping-invoice-line-001'
    );

    expect(lineItemResult).toBeDefined();
    expect(lineItemResult?.recommendations).toContain('別の移行対象システムの検討も推奨します');
  });
});
