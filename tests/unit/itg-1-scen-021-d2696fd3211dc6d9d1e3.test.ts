import { runTx3Imp1Agent, Tx3Imp1AiClient, DataflowMappingInconsistency } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as legacySystemMappingModule from '../../src/logic/legacy-system-mapping';

jest.mock('../../src/logic/legacy-system-mapping', () => ({
  ...jest.requireActual<typeof legacySystemMappingModule>('../../src/logic/legacy-system-mapping'),
  extractAndMapLegacySystemSpecification: jest.fn(),
  validateMappingCompleteness: jest.fn(),
  generateFunctionMappingTable: jest.fn(),
}));

describe('SCEN-021: 既存システムのデータフローが移行対象システムのデータモデルと矛盾する場合', () => {
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
          objectName: 'custom_object_1',
          fields: [
            { fieldName: 'field_id', fieldType: 'string', required: true },
            { fieldName: 'opportunity_reference', fieldType: 'string', required: true },
            { fieldName: 'account_reference', fieldType: 'string', required: true },
          ],
          calculationLogics: [{ logicName: 'calculation_logic_1', formula: 'quantity * unitPrice' }],
          references: [
            { referencedObject: 'Opportunity', relationshipType: 'lookup' },
            { referencedObject: 'Account', relationshipType: 'lookup' },
          ],
        },
      ],
      dataflow: [
        { stage: 1, objectName: 'Account', generationTrigger: 'manual_creation' },
        { stage: 2, objectName: 'Opportunity', generationTrigger: 'account_created' },
        { stage: 3, objectName: 'custom_object_1', generationTrigger: 'opportunity_closed_won' },
        { stage: 4, objectName: 'Invoice', generationTrigger: 'custom_object_1_created' },
      ],
    });

    (mockLegacySystemMapping.validateMappingCompleteness as jest.Mock).mockResolvedValue({
      isComplete: true,
      unmappedFeatures: [],
      partiallyMappedFeatures: [],
    });

    (mockLegacySystemMapping.generateFunctionMappingTable as jest.Mock).mockResolvedValue([]);
  });

  it('should throw DataflowMappingInconsistency when dataflow conflicts with target system model', async () => {
    const input: Tx3Imp1AgentInput = {
      legacySystemAccessCredentials: {
        systemName: 'Salesforce',
        accessUrl: 'https://legacy.salesforce.com',
        apiKey: 'valid_api_key_123',
      },
      targetSystemSpecification: {
        systemName: 'TargetERP',
        standardFeatures: [
          { featureName: 'CustomerManagement', description: '顧客・取引先管理', apiEndpoint: '/api/v1/customers' },
          { featureName: 'InvoiceGeneration', description: '請求書生成', apiEndpoint: '/api/v1/invoices' },
        ],
        dataModel: [
          { objectName: 'Customer', fields: [{ fieldName: 'customerId', fieldType: 'string' }, { fieldName: 'name', fieldType: 'string' }] },
          { objectName: 'Invoice', fields: [{ fieldName: 'invoiceId', fieldType: 'string' }, { fieldName: 'customerId', fieldType: 'string' }] },
        ],
        calculationCapabilities: [
          { calculationType: 'SummaryCaculation', supportedOperations: ['SUM', 'AVG'] },
        ],
      },
      executionContext: {
        requestedBy: 'accounting_dept_user',
        requestedAt: '2026-10-07T10:00:00Z',
        priority: 'high',
      },
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(DataflowMappingInconsistency);

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /既存システムのデータフローが移行対象システムのデータモデルと矛盾しています。参照関係と生成順序の見直しが必要です。/,
    );
  });
});
