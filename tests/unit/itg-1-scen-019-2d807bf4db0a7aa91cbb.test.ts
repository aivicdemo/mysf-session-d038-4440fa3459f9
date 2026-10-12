import { runTx3Imp1Agent, Tx3Imp1AiClient, FunctionMappingTableGenerationFailure } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as legacySystemMappingModule from '../../src/logic/legacy-system-mapping';

jest.mock('../../src/logic/legacy-system-mapping', () => ({
  ...jest.requireActual<typeof legacySystemMappingModule>('../../src/logic/legacy-system-mapping'),
  extractAndMapLegacySystemSpecification: jest.fn(),
  validateMappingCompleteness: jest.fn(),
  generateFunctionMappingTable: jest.fn(),
}));

describe('SCEN-019: 機能マッピング表の生成処理に失敗した場合', () => {
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
            { fieldName: 'invoiceNumber', fieldType: 'string', required: true },
            { fieldName: 'totalAmount', fieldType: 'currency', required: true },
          ],
          calculationLogics: [{ logicName: 'calculateLineTotal', formula: 'unitPrice * quantity * (1 - discountRate)' }],
          references: [{ referencedObject: 'Opportunity', relationshipType: 'lookup' }],
        },
      ],
      dataflow: [
        { stage: 1, objectName: 'Opportunity', generationTrigger: 'opportunity_closed_won' },
        { stage: 2, objectName: 'Invoice__c', generationTrigger: 'invoice_created_from_opportunity' },
      ],
    });

    (mockLegacySystemMapping.validateMappingCompleteness as jest.Mock).mockResolvedValue({
      isComplete: true,
      unmappedFeatures: [],
      partiallyMappedFeatures: [],
    });

    (mockLegacySystemMapping.generateFunctionMappingTable as jest.Mock).mockRejectedValue(
      new FunctionMappingTableGenerationFailure('機能マッピング表の生成に失敗しました。抽出データの形式を確認し、再度実行してください。'),
    );
  });

  it('should throw FunctionMappingTableGenerationFailure when table generation fails', async () => {
    const input: Tx3Imp1AgentInput = {
      legacySystemAccessCredentials: {
        systemName: 'Salesforce',
        accessUrl: 'https://example.salesforce.com',
        apiKey: 'valid-api-key-12345',
      },
      targetSystemSpecification: {
        systemName: 'TargetERP',
        standardFeatures: [
          { featureName: 'Account Management', description: '取引先管理', apiEndpoint: '/api/v1/accounts' },
        ],
        dataModel: [
          { objectName: 'Account', fields: [{ fieldName: 'accountId', fieldType: 'string' }, { fieldName: 'accountName', fieldType: 'string' }] },
        ],
        calculationCapabilities: [
          { calculationType: 'sum', supportedOperations: ['addition', 'subtraction'] },
        ],
      },
      executionContext: {
        requestedBy: 'finance-manager-001',
        requestedAt: '2026-10-07T10:00:00Z',
        priority: 'high',
      },
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(FunctionMappingTableGenerationFailure);

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /機能マッピング表の生成に失敗しました。抽出データの形式を確認し、再度実行してください。/,
    );
  });
});
