import { validateMappingAndClassifyGaps, ValidateMappingAndClassifyGapsInput, GapClassificationFailedError } from '../../src/logic/mapping-validation-service';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as mappingPersistenceModule from '../../src/logic/mapping-persistence';
import * as auditModule from '../../src/logic/audit-trail-service';

jest.mock('../../../src/logic/authentication-authorization');
jest.mock('../../../src/logic/project-context-resolver');
jest.mock('../../../src/logic/mapping-persistence');
jest.mock('../../../src/logic/audit-trail-service');

describe('SCEN-070: validateMappingAndClassifyGaps - エラー系：Salesforceのオブジェクト構成情報が不完全で分類失敗', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw GapClassificationFailedError when Salesforce object structure is incomplete', async () => {
    const input: ValidateMappingAndClassifyGapsInput = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      userId: 'user-123',
      sessionId: 'session-abc-xyz',
      executionTimestamp: 1704067200000,
      mappingDetailIds: ['mapping-invoice-001', 'mapping-invoice-line-002'],
    };

    const authResult = {
      authenticated: true,
      role: 'MAPPING_VALIDATOR',
      hasPermission: true,
      projectAccessible: true,
    };

    const projectResult = {
      projectId: 'proj-001',
      targetSystemId: 'sys-oracle-001',
      status: 'ACTIVE',
      isResolvable: true,
    };

    const mappingDetails = [
      {
        mappingDetailId: 'mapping-invoice-001',
        salesforceObjectName: 'Invoice__c',
        targetObjectName: 'AR_INVOICE',
        fieldMappings: [
          { salesforceField: 'InvoiceNumber__c', salesforceDataType: 'Text(20)', targetField: 'INVOICE_NO', targetDataType: 'VARCHAR2(20)' },
          { salesforceField: 'InvoiceDate__c', salesforceDataType: 'Date', targetField: 'INVOICE_DATE', targetDataType: 'DATE' },
          { salesforceField: 'TotalAmount__c', salesforceDataType: 'Currency', targetField: null, targetDataType: null, note: '計算式フィールド。対象システムでの実装方法不明' },
        ],
        calculationLogic: {
          name: 'TotalAmount__c',
          formula: 'SUM(InvoiceLineItems__r.Amount__c)',
          complexity: 'high',
          targetImplementation: null,
          resolutionStatus: 'unresolved',
        },
        relationships: [
          { relationshipName: 'InvoiceLineItems__r', relationshipType: 'MasterDetail', relatedObject: 'InvoiceLineItem__c', targetRelationship: 'AR_INVOICE_LINE.INVOICE_ID', isMapped: true },
          { relationshipName: 'Opportunity__r', relationshipType: 'Lookup', relatedObject: 'Opportunity', targetRelationship: null, isMapped: false, note: '参照先がないか、定義が不完全' },
        ],
        completeness: 'INCOMPLETE',
      },
      {
        mappingDetailId: 'mapping-invoice-line-002',
        salesforceObjectName: 'InvoiceLineItem__c',
        targetObjectName: 'AR_INVOICE_LINE',
        fieldMappings: [
          { salesforceField: 'LineNumber__c', salesforceDataType: 'Number(3,0)', targetField: 'LINE_NUMBER', targetDataType: 'NUMBER(3,0)' },
          { salesforceField: 'Amount__c', salesforceDataType: 'Currency', targetField: 'LINE_AMOUNT', targetDataType: 'NUMBER(15,2)' },
        ],
        calculationLogic: null,
        relationships: [{ relationshipName: 'Invoice__r', relationshipType: 'MasterDetail', relatedObject: 'Invoice__c', targetRelationship: 'AR_INVOICE.INVOICE_ID', isMapped: true }],
        completeness: 'INCOMPLETE',
      },
    ];

    const targetCapabilities = {
      systemName: 'Oracle EBS',
      standardFeatures: [
        {
          featureId: 'ar-invoice-mgmt',
          featureName: '請求管理',
          fields: [
            { name: 'INVOICE_NO', type: 'VARCHAR2(20)', isStandard: true },
            { name: 'INVOICE_DATE', type: 'DATE', isStandard: true },
            { name: 'TOTAL_AMOUNT', type: 'NUMBER(15,2)', isStandard: true, note: 'トリガーでの自動計算は不可。アプリケーション層で実装必須' },
          ],
          calculationSupported: false,
          limitations: 'トリガーによる複雑な計算式の実装が制限される。外部キー参照を含む集計計算は非対応。',
        },
        {
          featureId: 'ar-invoice-line-mgmt',
          featureName: '請求明細管理',
          fields: [
            { name: 'LINE_NUMBER', type: 'NUMBER(3,0)', isStandard: true },
            { name: 'LINE_AMOUNT', type: 'NUMBER(15,2)', isStandard: true },
          ],
          calculationSupported: false,
        },
      ],
      constraints: {
        hasCustomizationApi: true,
        maxAllowedCustomizations: 50,
        restrictedAreas: ['Core accounting tables structure', 'Standard calculation algorithms'],
      },
    };

    jest.mocked(authModule.verifyUserAuthenticationAndAuthorization).mockResolvedValue(authResult);
    jest.mocked(projectContextModule.resolveProjectContext).mockResolvedValue(projectResult);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsForProject).mockResolvedValue(mappingDetails);
    jest.mocked(mappingPersistenceModule.retrieveMappingDetailsByTargetSystem).mockResolvedValue(targetCapabilities);

    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow(GapClassificationFailedError);
    await expect(validateMappingAndClassifyGaps(input)).rejects.toThrow('ギャップ分類処理に失敗しました。');
  });
});
