import { runTx3Imp1Agent, Tx3Imp1AiClient, MappingCompletenessValidationFailed } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as legacySystemMappingModule from '../../src/logic/legacy-system-mapping';

jest.mock('../../src/logic/legacy-system-mapping', () => ({
  ...jest.requireActual<typeof legacySystemMappingModule>('../../src/logic/legacy-system-mapping'),
  extractAndMapLegacySystemSpecification: jest.fn(),
  validateMappingCompleteness: jest.fn(),
}));

describe('SCEN-018: 既存システムの機能のうち、移行対象システムの標準機能にマッピングできない機能が存在する場合', () => {
  let mockAiClient: Tx3Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAiClient = {
      method1: jest.fn(),
    };

    const mockLegacySystemMapping = legacySystemMappingModule as jest.Mocked<typeof legacySystemMappingModule>;

    (mockLegacySystemMapping.extractAndMapLegacySystemSpecification as jest.Mock).mockResolvedValue({
      customObjects: [
        {
          objectName: 'Invoice__c',
          fields: [
            { fieldName: 'Amount__c', fieldType: 'Currency', required: true },
            { fieldName: 'Opportunity__c', fieldType: 'Lookup', required: true },
          ],
          calculationLogics: [{ logicName: 'TaxCalculation', formula: 'Amount__c * 0.1' }],
          references: [{ referencedObject: 'Opportunity', relationshipType: 'Lookup' }],
        },
        {
          objectName: 'InvoiceLineItem__c',
          fields: [
            { fieldName: 'Quantity__c', fieldType: 'Number', required: true },
            { fieldName: 'UnitPrice__c', fieldType: 'Currency', required: true },
          ],
          calculationLogics: [{ logicName: 'NetAmount', formula: 'Quantity__c * UnitPrice__c * 1.5' }],
          references: [{ referencedObject: 'Invoice__c', relationshipType: 'Lookup' }],
        },
      ],
      dataflow: [
        { stage: 1, objectName: 'Opportunity', generationTrigger: '商談作成時' },
        { stage: 2, objectName: 'Invoice__c', generationTrigger: '請求書作成時' },
        { stage: 3, objectName: 'InvoiceLineItem__c', generationTrigger: '請求明細作成時' },
      ],
    });

    (mockLegacySystemMapping.validateMappingCompleteness as jest.Mock).mockRejectedValue(
      new MappingCompletenessValidationFailed('以下の既存システム機能は移行対象システムの標準機能にマッピングできません。カスタマイズまたは代替機能の検討が必要です。'),
    );
  });

  it('should throw MappingCompletenessValidationFailed when unmapped features exist', async () => {
    const input: Tx3Imp1AgentInput = {
      legacySystemAccessCredentials: {
        systemName: 'Salesforce',
        accessUrl: 'https://example.salesforce.com',
        apiKey: 'valid_api_key_12345',
      },
      targetSystemSpecification: {
        systemName: 'TargetERP',
        standardFeatures: [
          { featureName: '顧客管理', description: '取引先・取引先責任者の管理', apiEndpoint: '/api/customers' },
          { featureName: '受注管理', description: '商談・商談商品の管理', apiEndpoint: '/api/orders' },
        ],
        dataModel: [
          { objectName: 'Customer', fields: [{ fieldName: 'customerId', fieldType: 'string' }] },
          { objectName: 'Order', fields: [{ fieldName: 'orderId', fieldType: 'string' }] },
        ],
        calculationCapabilities: [
          { calculationType: '基本四則演算', supportedOperations: ['加算', '減算'] },
        ],
      },
      executionContext: {
        requestedBy: 'admin@example.com',
        requestedAt: '2026-10-08T10:00:00Z',
        priority: 'high',
      },
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(MappingCompletenessValidationFailed);
  });
});
