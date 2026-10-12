import { runTx3Imp1Agent, Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as legacySystemMappingModule from '../../src/logic/legacy-system-mapping';

jest.mock('../../src/logic/legacy-system-mapping', () => ({
  ...jest.requireActual<typeof import('../../src/logic/legacy-system-mapping')>('../../src/logic/legacy-system-mapping'),
  extractAndMapLegacySystemSpecification: jest.fn(),
  validateMappingCompleteness: jest.fn(),
  generateFunctionMappingTable: jest.fn(),
}));

describe('SCEN-024: 複数のデータフロー段階が存在する場合、各段階のオブジェクト参照関係と生成順序を検証する', () => {
  let mockAiClient: jest.Mocked<Tx3Imp1AiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {} as jest.Mocked<Tx3Imp1AiClient>;
  });

  it('should detect dataflow inconsistency when BillingDocument is referenced at stage 4 in multi-stage dataflow', async () => {
    const legacySystemAccessCredentials = {
      systemName: 'Salesforce',
      accessUrl: 'https://legacy.salesforce.com',
      apiKey: 'valid_api_key_123',
    };

    const targetSystemSpecification = {
      systemName: 'TargetERP',
      standardFeatures: [
        {
          featureName: 'Invoice Management',
          description: '標準請求書管理',
          apiEndpoint: '/api/invoices',
        },
        {
          featureName: 'Object Reference',
          description: 'オブジェクト参照管理',
          apiEndpoint: '/api/references',
        },
      ],
      dataModel: [
        {
          objectName: 'Invoice',
          fields: [
            { fieldName: 'invoiceId', fieldType: 'string' },
            { fieldName: 'accountId', fieldType: 'string' },
          ],
        },
        {
          objectName: 'Account',
          fields: [{ fieldName: 'accountId', fieldType: 'string' }],
        },
        {
          objectName: 'InvoiceLineItem',
          fields: [
            { fieldName: 'lineItemId', fieldType: 'string' },
            { fieldName: 'invoiceId', fieldType: 'string' },
          ],
        },
      ],
      calculationCapabilities: [
        {
          calculationType: 'SUM',
          supportedOperations: ['addition'],
        },
      ],
    };

    const executionContext = {
      requestedBy: 'accounting_user_001',
      requestedAt: '2025-01-15T09:00:00Z',
      priority: 'high' as const,
    };

    const legacySystemSpecification = {
      customObjects: [
        {
          objectName: 'BillingDocument',
          fields: [
            { fieldName: 'documentId', fieldType: 'string', required: true },
            { fieldName: 'relatedAccountRef', fieldType: 'reference', required: true },
          ],
          calculationLogics: [
            { logicName: 'TotalAmountCalculation', formula: 'SUM(relatedLineItems.amount)' },
          ],
          references: [
            { referencedObject: 'Account', relationshipType: 'lookup' },
            { referencedObject: 'BillingLineItem', relationshipType: 'child' },
          ],
        },
        {
          objectName: 'BillingLineItem',
          fields: [
            { fieldName: 'lineItemId', fieldType: 'string', required: true },
            { fieldName: 'parentDocumentRef', fieldType: 'reference', required: true },
          ],
          calculationLogics: [],
          references: [
            { referencedObject: 'BillingDocument', relationshipType: 'parent' },
          ],
        },
      ],
      dataflow: [
        { stage: 1, objectName: 'Account', generationTrigger: 'account_created' },
        { stage: 2, objectName: 'BillingDocument', generationTrigger: 'document_initiated' },
        { stage: 3, objectName: 'BillingLineItem', generationTrigger: 'line_item_added' },
        { stage: 4, objectName: 'BillingDocument', generationTrigger: 'document_finalized' },
      ],
    };

    const mappingValidationResult = {
      isComplete: false,
      unmappedFeatures: [],
      partiallyMappedFeatures: [
        {
          featureName: 'BillingDocument',
          mappedTo: 'Invoice',
          gaps: ['reference_order_violation'],
        },
      ],
    };

    (legacySystemMappingModule.extractAndMapLegacySystemSpecification as jest.Mock).mockResolvedValue(
      legacySystemSpecification
    );

    (legacySystemMappingModule.validateMappingCompleteness as jest.Mock).mockResolvedValue(
      mappingValidationResult
    );

    (legacySystemMappingModule.generateFunctionMappingTable as jest.Mock).mockResolvedValue([
      {
        legacyFeature: 'BillingDocument',
        legacyFeatureType: 'custom_object' as const,
        targetSystemFeature: 'Invoice',
        mappingStatus: 'partial_mapped' as const,
        mappingNotes: '既存システムのデータフロー Stage 4 でオブジェクトが再参照されており、ターゲットシステムの単方向参照制約に矛盾する',
        requiresCustomization: true,
        customizationNotes: 'Stage 4 での再参照を排除し、Stage 2-3 の単方向フロー（Account→Invoice→InvoiceLineItem）に統一する必要がある',
      },
      {
        legacyFeature: 'BillingLineItem',
        legacyFeatureType: 'custom_object' as const,
        targetSystemFeature: 'InvoiceLineItem',
        mappingStatus: 'mapped' as const,
        mappingNotes: '',
        requiresCustomization: false,
      },
      {
        legacyFeature: 'TotalAmountCalculation',
        legacyFeatureType: 'calculation_logic' as const,
        targetSystemFeature: 'SUM',
        mappingStatus: 'mapped' as const,
        mappingNotes: '',
        requiresCustomization: false,
      },
    ]);

    const input = {
      legacySystemAccessCredentials,
      targetSystemSpecification,
      executionContext,
    };

    const result = await runTx3Imp1Agent(input, mockAiClient) as any;

    expect(result.status).toBe('partial_success');
    expect(result.dataflowConsistencyAnalysis.isConsistent).toBe(false);

    const stage4Inconsistency = result.dataflowConsistencyAnalysis.inconsistencies.find(
      (inc) => inc.stage === 4 && inc.objectName === 'BillingDocument'
    );
    expect(stage4Inconsistency).toBeDefined();
    expect(stage4Inconsistency?.issue).toContain('再参照');
    expect(stage4Inconsistency?.issue).toContain('ターゲットシステムの単方向');
    expect(stage4Inconsistency?.issue).toContain('矛盾');
    expect(stage4Inconsistency?.recommendation).toContain('Stage 4');
    expect(stage4Inconsistency?.recommendation).toContain('排除');
    expect(stage4Inconsistency?.recommendation).toContain('Stage 2-3');
    expect(stage4Inconsistency?.recommendation).toContain('単方向');

    const warningMessage = result.executionSummary.warnings.find((w) =>
      w.includes('Stage 4') && w.includes('再参照') && w.includes('ターゲットシステム') && w.includes('単方向')
    );
    expect(warningMessage).toBeDefined();

    const totalAmountCalcAnalysis = result.calculationLogicAnalysis.find(
      (calc) => calc.logicName === 'TotalAmountCalculation'
    );
    expect(totalAmountCalcAnalysis).toBeDefined();
    expect(['native_support', 'custom_formula_required']).toContain(
      totalAmountCalcAnalysis?.targetSystemCapability
    );

    const billingDocumentMapping = result.functionMappingTable.find(
      (mapping) => mapping.legacyFeature === 'BillingDocument'
    );
    expect(billingDocumentMapping).toBeDefined();
    expect(billingDocumentMapping?.mappingStatus).toBe('partial_mapped');
    expect(billingDocumentMapping?.mappingNotes).toContain('参照順序');
    expect(billingDocumentMapping?.mappingNotes).toContain('矛盾');
  });
});
