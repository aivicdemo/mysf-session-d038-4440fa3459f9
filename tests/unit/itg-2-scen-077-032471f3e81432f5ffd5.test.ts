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

describe('SCEN-077: ギャップスコアが80以上かつ必須機能の場合、警告メッセージが生成される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gapScore >= 80 かつ businessRequirementLevel が必須の場合、推奨事項に警告メッセージを含む', async () => {
    const mockAuthResult = {
      isAuthenticated: true,
      userId: 'user-accounting-mgr-001',
      userRole: 'ACCOUNTING_MANAGER',
      hasValidSession: true,
      projectAccessLevel: 'FULL_ACCESS',
      canExecuteValidation: true,
    };

    const mockProjectContext = {
      projectId: 'proj-migration-2024-001',
      targetSystemId: 'target-erp-oracle-001',
      projectStatus: 'ACTIVE',
      systemStatus: 'CONFIGURED',
      isContextValid: true,
    };

    const mockMappingDetails = [
      {
        mappingDetailId: 'mapping-detail-invoice-amount-calc-001',
        featureName: '請求書金額計算',
        salesforceObjectName: 'Invoice__c',
        salesforceFieldSpecs: {
          fields: ['Amount__c', 'LineTotal__c'],
          calculations: 'Amount__c = SUM(LineTotal__c from Invoice_Line_Item__c)',
        },
        businessRequirementLevel: '必須',
        mappingStatus: 'PENDING_VALIDATION',
      },
      {
        mappingDetailId: 'mapping-detail-invoice-tax-calc-002',
        featureName: '請求書税額計算',
        salesforceObjectName: 'Invoice__c',
        salesforceFieldSpecs: {
          fields: ['TaxAmount__c', 'TaxRate__c'],
          calculations: 'TaxAmount__c = LineTotal__c * TaxRate__c / 100',
        },
        businessRequirementLevel: '必須',
        mappingStatus: 'PENDING_VALIDATION',
      },
    ];

    const mockTargetSystemCapabilities = {
      targetSystemId: 'target-erp-oracle-001',
      standardFeatures: [
        {
          featureName: '請求書金額計算',
          targetFieldName: 'INVOICE_TOTAL_AMOUNT',
          targetCalculationCapability: 'SUM_FUNCTION',
          fieldMatchScore: 0.15,
          logicMatchScore: 0.1,
          relationshipMatchScore: 0.05,
          overallMatch: 0.1,
          customizationAvailable: true,
          apiAvailable: true,
          customizationLimits: 100,
        },
        {
          featureName: '請求書税額計算',
          targetFieldName: 'INVOICE_TAX_AMOUNT',
          targetCalculationCapability: 'BASIC_ARITHMETIC',
          fieldMatchScore: 0.12,
          logicMatchScore: 0.08,
          relationshipMatchScore: 0.03,
          overallMatch: 0.08,
          customizationAvailable: true,
          apiAvailable: true,
          customizationLimits: 100,
        },
      ],
    };

    (verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue(mockAuthResult);
    (resolveProjectContext as jest.Mock).mockResolvedValue(mockProjectContext);
    (retrieveMappingDetailsForProject as jest.Mock).mockResolvedValue(mockMappingDetails);
    (retrieveMappingDetailsByTargetSystem as jest.Mock).mockResolvedValue(mockTargetSystemCapabilities);
    (createRecord as jest.Mock).mockResolvedValue({
      validationResultId: 'validation-result-20240115-001',
    });
    (recordMappingValidationAuditTrail as jest.Mock).mockResolvedValue({
      auditId: 'audit-20240115-001',
    });

    const input = {
      projectId: 'proj-migration-2024-001',
      targetSystemId: 'target-erp-oracle-001',
      userId: 'user-accounting-mgr-001',
      sessionId: 'session-valid-20240115-abc123',
      executionTimestamp: 1705310400000,
      mappingDetailIds: ['mapping-detail-invoice-amount-calc-001', 'mapping-detail-invoice-tax-calc-002'],
    };

    const result = await validateMappingAndClassifyGaps(input);

    expect(result).toBeDefined();
    expect(result.validationStatus).toBe('完了');
    expect(result.classificationResults).toHaveLength(2);

    // Check for gapScore >= 80 and warning message
    const invoiceAmountResult = result.classificationResults.find(
      (r) => r.mappingDetailId === 'mapping-detail-invoice-amount-calc-001'
    );
    const invoiceTaxResult = result.classificationResults.find(
      (r) => r.mappingDetailId === 'mapping-detail-invoice-tax-calc-002'
    );

    expect(invoiceAmountResult?.gapScore).toBeGreaterThanOrEqual(80);
    expect(invoiceTaxResult?.gapScore).toBeGreaterThanOrEqual(80);

    // Verify warning message is included
    expect(invoiceAmountResult?.recommendations).toContain('移行リスクが高い。代替案検討が必要です');
    expect(invoiceTaxResult?.recommendations).toContain('移行リスクが高い。代替案検討が必要です');

    expect(result.overallRiskLevel).toBe('高');
  });
});
