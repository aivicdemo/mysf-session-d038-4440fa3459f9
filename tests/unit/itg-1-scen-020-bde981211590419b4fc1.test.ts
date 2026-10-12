import { runTx3Imp1Agent, Tx3Imp1AiClient, CalculationLogicMappingIncomplete } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as legacySystemMappingModule from '../../src/logic/legacy-system-mapping';

jest.mock('../../src/logic/legacy-system-mapping', () => ({
  ...jest.requireActual<typeof legacySystemMappingModule>('../../src/logic/legacy-system-mapping'),
  extractAndMapLegacySystemSpecification: jest.fn(),
  validateMappingCompleteness: jest.fn(),
  generateFunctionMappingTable: jest.fn(),
}));

describe('SCEN-020: 既存システムの計算ロジックのうち、移行対象システムの標準計算機能では実装できないロジックが存在する場合', () => {
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
          objectName: 'Invoice',
          fields: [
            { fieldName: 'invoiceId', fieldType: 'string', required: true },
            { fieldName: 'totalAmount', fieldType: 'decimal', required: true },
            { fieldName: 'taxRate', fieldType: 'percent', required: false },
          ],
          calculationLogics: [
            { logicName: 'calcTaxAmount', formula: 'IF(taxRate > 0, totalAmount * taxRate / 100, 0)' },
            { logicName: 'calcConditionalDiscount', formula: 'IF(totalAmount > 1000000 AND MONTH(createdDate) = 12, totalAmount * 0.15, IF(totalAmount > 500000, totalAmount * 0.05, 0))' },
            { logicName: 'calcDynamicCommission', formula: "CASE WHEN customerType = 'VIP' THEN amount * 0.25 WHEN customerType = 'Regular' THEN amount * 0.10 WHEN customerType = 'New' THEN amount * 0.03 ELSE 0 END" },
          ],
          references: [{ referencedObject: 'Opportunity', relationshipType: 'many-to-one' }],
        },
      ],
      dataflow: [
        { stage: 1, objectName: 'Opportunity', generationTrigger: 'opportunity_closed_won' },
        { stage: 2, objectName: 'Invoice', generationTrigger: 'invoice_creation_from_opportunity' },
      ],
    });

    (mockLegacySystemMapping.validateMappingCompleteness as jest.Mock).mockResolvedValue({
      isComplete: false,
      unmappedFeatures: [],
      partiallyMappedFeatures: [],
    });

    (mockLegacySystemMapping.generateFunctionMappingTable as jest.Mock).mockResolvedValue([]);
  });

  it('should throw CalculationLogicMappingIncomplete when calculation logic is not supported', async () => {
    const input: Tx3Imp1AgentInput = {
      legacySystemAccessCredentials: {
        systemName: 'Salesforce',
        accessUrl: 'https://legacy.salesforce.com',
        apiKey: 'valid_api_key_12345',
      },
      targetSystemSpecification: {
        systemName: 'NewERP',
        standardFeatures: [
          { featureName: '基本取引先管理', description: '取引先の基本情報管理', apiEndpoint: '/api/v1/customers' },
          { featureName: '基本商談管理', description: '商談の基本情報管理', apiEndpoint: '/api/v1/opportunities' },
        ],
        dataModel: [
          { objectName: 'Customer', fields: [{ fieldName: 'customerId', fieldType: 'string' }, { fieldName: 'customerName', fieldType: 'string' }] },
          { objectName: 'Opportunity', fields: [{ fieldName: 'opportunityId', fieldType: 'string' }, { fieldName: 'amount', fieldType: 'decimal' }] },
        ],
        calculationCapabilities: [
          { calculationType: 'basic_arithmetic', supportedOperations: ['add', 'subtract', 'multiply'] },
        ],
      },
      executionContext: {
        requestedBy: 'migration_admin',
        requestedAt: '2025-01-15T10:00:00Z',
        priority: 'high',
      },
    };

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(CalculationLogicMappingIncomplete);

    await expect(runTx3Imp1Agent(input, mockAiClient)).rejects.toThrow(
      /以下の計算ロジックは移行対象システムの標準機能では実装できません。カスタム計算式またはワークフロー設定が必要です。/,
    );
  });
});
