import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput, GapClassificationFailedError } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-069: validateMappingAndClassifyGaps - エラー系：ギャップ分類ロジック実行中にエラーが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw GapClassificationFailedError when gap classification fails', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-20240115-001',
      targetSystemId: 'tsys-oracle-erp-v12',
      userId: 'user-sales-admin-001',
      sessionId: 'sess-valid-20240115-001',
      executionTimestamp: 1705315200000,
      mappingDetailIds: ['map-detail-invoice-001', 'map-detail-line-001', 'map-detail-calc-001'],
    };

    const authResult = {
      userId: 'user-sales-admin-001',
      role: 'SalesAdmin',
      hasProjectAccess: true,
      canExecuteValidation: true,
      auditTrailEnabled: true,
    };

    const projectResult = {
      projectId: 'proj-20240115-001',
      targetSystemId: 'tsys-oracle-erp-v12',
      projectStatus: 'active',
      isValid: true,
    };

    const mappingDetails = [
      {
        mappingDetailId: 'map-detail-invoice-001',
        salesforceObjectName: 'Invoice__c',
        fields: [
          { fieldName: 'InvoiceNumber__c', dataType: 'Text', isCalculated: false },
          { fieldName: 'TotalAmount__c', dataType: 'Currency', isCalculated: true, calculationLogic: 'SUM(InvoiceLine__r.Amount__c)' },
        ],
        relationships: [{ relatedObject: 'Opportunity', relationshipType: 'lookup' }],
      },
      {
        mappingDetailId: 'map-detail-line-001',
        salesforceObjectName: 'InvoiceLine__c',
        fields: [
          { fieldName: 'LineNumber__c', dataType: 'Number', isCalculated: false },
          { fieldName: 'Amount__c', dataType: 'Currency', isCalculated: false },
        ],
        relationships: [{ relatedObject: 'Invoice__c', relationshipType: 'master-detail' }],
      },
      {
        mappingDetailId: 'map-detail-calc-001',
        salesforceObjectName: 'Invoice__c',
        fields: [
          { fieldName: 'CalculationField__c', dataType: 'Text', isCalculated: true, calculationLogic: 'INVALID_SYNTAX_ERROR' },
        ],
        relationships: [],
      },
    ];

    const targetCapabilities = [
      {
        featureName: 'invoice_header',
        standardFields: [
          { fieldName: 'invoice_number', dataType: 'VARCHAR2(50)', isAvailable: true },
          { fieldName: 'total_amount', dataType: 'NUMBER(15,2)', isAvailable: true },
        ],
        calculationCapability: 'supported',
        customizationLimits: { api_availability: true, customization_limits: 5 },
      },
      {
        featureName: 'invoice_line',
        standardFields: [
          { fieldName: 'line_number', dataType: 'NUMBER', isAvailable: true },
          { fieldName: 'line_amount', dataType: 'NUMBER(15,2)', isAvailable: true },
        ],
        calculationCapability: 'supported',
        customizationLimits: { api_availability: true, customization_limits: 3 },
      },
    ];

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);
    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue(projectResult);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsForProject).mockResolvedValue(mappingDetails);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsByTargetSystem).mockResolvedValue(targetCapabilities);

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(GapClassificationFailedError);
    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow('ギャップ分類処理に失敗しました。');
  });
});
