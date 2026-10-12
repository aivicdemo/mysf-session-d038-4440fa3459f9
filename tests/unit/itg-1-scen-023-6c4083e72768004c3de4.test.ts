import { runTx3Imp1Agent, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as legacySystemMappingModule from '../../src/logic/legacy-system-mapping';

jest.mock('../../src/logic/legacy-system-mapping', () => ({
  ...jest.requireActual<typeof legacySystemMappingModule>('../../src/logic/legacy-system-mapping'),
  extractAndMapLegacySystemSpecification: jest.fn(),
  validateMappingCompleteness: jest.fn(),
  generateFunctionMappingTable: jest.fn(),
}));

describe('SCEN-023: 複数の計算ロジックが存在する場合、各ロジックについて移行対象システムでの実装可能性を個別に分析し、calculationLogicAnalysisに全て記録する', () => {
  let mockLegacySystemMapping: jest.Mocked<typeof legacySystemMappingModule>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLegacySystemMapping = legacySystemMappingModule as jest.Mocked<
      typeof legacySystemMappingModule
    >;
  });

  it('should analyze all calculation logics individually and record in calculationLogicAnalysis', async () => {
    (mockLegacySystemMapping.extractAndMapLegacySystemSpecification as jest.Mock).mockResolvedValue(
      {
        customObjects: [
          {
            objectName: 'CustomInvoice',
            fields: [
              { fieldName: 'invoiceId', fieldType: 'String', required: true },
              { fieldName: 'subtotal', fieldType: 'Decimal', required: true },
              { fieldName: 'tax', fieldType: 'Decimal', required: true },
              { fieldName: 'total', fieldType: 'Decimal', required: true },
            ],
            calculationLogics: [
              {
                logicName: 'Logic_001',
                formula: 'subtotal * rate',
              },
              {
                logicName: 'Logic_002',
                formula: 'subtotal + tax',
              },
              {
                logicName: 'Logic_003',
                formula: "IF(type='A', total * 0.9, total)",
              },
              {
                logicName: 'Logic_004',
                formula:
                  "IF(AND(amount>100000, location='REGION1'), amount * 0.05, IF(amount>50000, amount * 0.03, amount * 0.01))",
              },
            ],
            references: [
              { referencedObject: 'StandardAccount', relationshipType: 'Lookup' },
              {
                referencedObject: 'StandardOpportunity',
                relationshipType: 'MasterDetail',
              },
            ],
          },
        ],
        dataflow: [
          {
            stage: 1,
            objectName: 'CustomInvoice',
            generationTrigger: "Opportunity.StageName = 'Closed Won'",
          },
          {
            stage: 2,
            objectName: 'CustomInvoiceLineItem',
            generationTrigger: 'CustomInvoice.invoiceId created',
          },
        ],
      },
    );

    (mockLegacySystemMapping.validateMappingCompleteness as jest.Mock).mockResolvedValue(
      {
        isComplete: true,
        unmappedFeatures: [],
        partiallyMappedFeatures: [],
      },
    );

    (mockLegacySystemMapping.generateFunctionMappingTable as jest.Mock).mockResolvedValue(
      [
        {
          legacyFeature: 'Logic_001',
          legacyFeatureType: 'calculation_logic',
          targetSystemFeature: 'StandardCalculation_SUM',
          mappingStatus: 'mapped',
          mappingNotes: 'Basic multiplication calculation maps directly.',
          requiresCustomization: false,
        },
        {
          legacyFeature: 'Logic_002',
          legacyFeatureType: 'calculation_logic',
          targetSystemFeature: 'StandardCalculation_SUM',
          mappingStatus: 'mapped',
          mappingNotes: 'Addition calculation maps directly.',
          requiresCustomization: false,
        },
        {
          legacyFeature: 'Logic_003',
          legacyFeatureType: 'calculation_logic',
          targetSystemFeature: 'CustomFormula',
          mappingStatus: 'mapped',
          mappingNotes: 'IF condition maps to conditional calculation.',
          requiresCustomization: false,
        },
        {
          legacyFeature: 'Logic_004',
          legacyFeatureType: 'calculation_logic',
          targetSystemFeature: 'CustomFormula',
          mappingStatus: 'partial_mapped',
          mappingNotes: 'Complex nested logic requires custom formula.',
          requiresCustomization: true,
          customizationNotes:
            'Nested IF and AND logic requires custom calculation formula implementation.',
        },
        {
          legacyFeature: 'CustomInvoice',
          legacyFeatureType: 'custom_object',
          targetSystemFeature: 'Invoice',
          mappingStatus: 'mapped',
          mappingNotes: 'Custom invoice object maps to standard Invoice.',
          requiresCustomization: false,
        },
      ],
    );

    const mockAiClient = {
      extractAndMapLegacySystemSpecification: jest.fn(),
      validateMappingCompleteness: jest.fn(),
      generateFunctionMappingTable: jest.fn(),
    };

    const input = {
      legacySystemAccessCredentials: {
        systemName: 'Salesforce',
        accessUrl: 'https://legacy.salesforce.com',
        apiKey: 'valid_api_key_12345',
      },
      targetSystemSpecification: {
        systemName: 'TargetERP',
        standardFeatures: [
          {
            featureName: 'StandardCalculation_SUM',
            description: '合計計算',
            apiEndpoint: '/api/calc/sum',
          },
          {
            featureName: 'StandardCalculation_PERCENTAGE',
            description: 'パーセンテージ計算',
            apiEndpoint: '/api/calc/percentage',
          },
          {
            featureName: 'CustomFormula',
            description: 'カスタム計算式',
            apiEndpoint: '/api/calc/custom',
          },
        ],
        dataModel: [
          {
            objectName: 'Invoice',
            fields: [
              { fieldName: 'invoiceAmount', fieldType: 'Decimal' },
              { fieldName: 'taxRate', fieldType: 'Decimal' },
            ],
          },
        ],
        calculationCapabilities: [
          {
            calculationType: 'arithmetic',
            supportedOperations: ['ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE'],
          },
          {
            calculationType: 'conditional',
            supportedOperations: ['IF', 'AND', 'OR'],
          },
        ],
      },
      executionContext: {
        requestedBy: 'accounting_manager_001',
        requestedAt: '2026-10-08T10:00:00Z',
        priority: 'high' as const,
      },
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('success');

    expect(result.calculationLogicAnalysis).toHaveLength(4);

    const logic001 = result.calculationLogicAnalysis.find(
      (a) => a.logicName === 'Logic_001',
    );
    expect(logic001).toBeDefined();
    expect(logic001?.legacyFormula).toBe('subtotal * rate');
    expect(logic001?.targetSystemCapability).toBe('native_support');
    expect(logic001?.implementationNotes).toContain('arithmetic');
    expect(logic001?.implementationNotes).toContain('MULTIPLY');

    const logic002 = result.calculationLogicAnalysis.find(
      (a) => a.logicName === 'Logic_002',
    );
    expect(logic002).toBeDefined();
    expect(logic002?.legacyFormula).toBe('subtotal + tax');
    expect(logic002?.targetSystemCapability).toBe('native_support');
    expect(logic002?.implementationNotes).toContain('arithmetic');
    expect(logic002?.implementationNotes).toContain('ADD');

    const logic003 = result.calculationLogicAnalysis.find(
      (a) => a.logicName === 'Logic_003',
    );
    expect(logic003).toBeDefined();
    expect(logic003?.legacyFormula).toContain("IF(type='A'");
    expect(logic003?.targetSystemCapability).toBe('native_support');
    expect(logic003?.implementationNotes).toContain('conditional');
    expect(logic003?.implementationNotes).toContain('IF');

    const logic004 = result.calculationLogicAnalysis.find(
      (a) => a.logicName === 'Logic_004',
    );
    expect(logic004).toBeDefined();
    expect(logic004?.legacyFormula).toContain('IF(AND');
    expect(logic004?.targetSystemCapability).toBe('custom_formula_required');
    expect(logic004?.implementationNotes).toContain('ネストされた IF');
    expect(logic004?.implementationNotes).toContain('AND');
    expect(logic004?.implementationNotes).toContain('カスタム計算式');

    expect(result.executionSummary.totalFeaturesAnalyzed).toBe(4);
    expect(result.executionSummary.mappedFeatures).toBe(3);
    expect(result.executionSummary.partiallyMappedFeatures).toBe(0);
    expect(result.executionSummary.unmappedFeatures).toBe(0);
    expect(result.executionSummary.customizationRequired).toBe(true);
    expect(result.executionSummary.estimatedCustomizationEffort).toBe('medium');

    expect(result.executionSummary.warnings.length).toBeGreaterThan(0);
    expect(
      result.executionSummary.warnings.some((w) => w.includes('Logic_004')),
    ).toBe(true);
    expect(result.executionSummary.errors).toHaveLength(0);

    expect(result.mappingValidationResult.isComplete).toBe(true);

    const logic004Mapping = result.functionMappingTable.find(
      (r) => r.legacyFeature === 'Logic_004',
    );
    expect(logic004Mapping?.mappingStatus).toBe('partial_mapped');
    expect(logic004Mapping?.requiresCustomization).toBe(true);
    expect(logic004Mapping?.customizationNotes).toContain('IF');
    expect(logic004Mapping?.customizationNotes).toContain('AND');

    expect(result.verificationDocument.documentFormat).toMatch(
      /^(pdf|xlsx|html)$/,
    );
    expect(result.verificationDocument.documentUrl).toBeTruthy();
  });
});
