import { runTx3Imp1Agent, Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AgentInput, Tx3Imp1AgentOutput } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as legacySystemMappingModule from '../../src/logic/legacy-system-mapping';

jest.mock('../../src/logic/legacy-system-mapping', () => ({
  ...jest.requireActual<typeof legacySystemMappingModule>('../../src/logic/legacy-system-mapping'),
  extractAndMapLegacySystemSpecification: jest.fn(),
  validateMappingCompleteness: jest.fn(),
  generateFunctionMappingTable: jest.fn(),
}));

describe('SCEN-015: 既存システムの仕様が正常に抽出でき、移行対象システムの標準機能と完全にマッピングできた場合', () => {
  let mockAiClient: Tx3Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAiClient = {
      method1: jest.fn(),
      method2: jest.fn(),
    };

    const mockLegacySystemMapping = legacySystemMappingModule as jest.Mocked<typeof legacySystemMappingModule>;

    (mockLegacySystemMapping.extractAndMapLegacySystemSpecification as jest.Mock).mockResolvedValue({
      customObjects: [
        {
          objectName: 'Account',
          fields: [
            { fieldName: 'accountId', fieldType: 'string', required: true },
            { fieldName: 'accountName', fieldType: 'string', required: true },
          ],
          calculationLogics: [],
          references: [],
        },
        {
          objectName: 'Contact',
          fields: [
            { fieldName: 'contactId', fieldType: 'string', required: true },
            { fieldName: 'contactName', fieldType: 'string', required: true },
          ],
          calculationLogics: [],
          references: [{ referencedObject: 'Account', relationshipType: 'many_to_one' }],
        },
        {
          objectName: 'Opportunity',
          fields: [
            { fieldName: 'opportunityId', fieldType: 'string', required: true },
            { fieldName: 'opportunityName', fieldType: 'string', required: true },
            { fieldName: 'amount', fieldType: 'decimal', required: true },
          ],
          calculationLogics: [],
          references: [{ referencedObject: 'Account', relationshipType: 'many_to_one' }],
        },
        {
          objectName: 'Invoice',
          fields: [
            { fieldName: 'invoiceId', fieldType: 'string', required: true },
            { fieldName: 'totalAmount', fieldType: 'decimal', required: true },
            { fieldName: 'taxAmount', fieldType: 'decimal', required: false },
          ],
          calculationLogics: [{ logicName: 'TaxCalculation', formula: 'totalAmount * 0.1' }],
          references: [{ referencedObject: 'Opportunity', relationshipType: 'many_to_one' }],
        },
        {
          objectName: 'InvoiceLine',
          fields: [
            { fieldName: 'lineId', fieldType: 'string', required: true },
            { fieldName: 'amount', fieldType: 'decimal', required: true },
          ],
          calculationLogics: [],
          references: [{ referencedObject: 'Invoice', relationshipType: 'many_to_one' }],
        },
      ],
      dataflow: [
        { stage: 1, objectName: 'Account', generationTrigger: 'manual_creation' },
        { stage: 2, objectName: 'Contact', generationTrigger: 'account_created' },
        { stage: 3, objectName: 'Opportunity', generationTrigger: 'account_exists' },
        { stage: 4, objectName: 'Invoice', generationTrigger: 'opportunity_closed_won' },
        { stage: 5, objectName: 'InvoiceLine', generationTrigger: 'invoice_created' },
      ],
    });

    (mockLegacySystemMapping.validateMappingCompleteness as jest.Mock).mockResolvedValue({
      isComplete: true,
      unmappedFeatures: [],
      partiallyMappedFeatures: [],
    });

    (mockLegacySystemMapping.generateFunctionMappingTable as jest.Mock).mockResolvedValue([
      {
        legacyFeature: 'Account',
        legacyFeatureType: 'custom_object',
        targetSystemFeature: 'Account',
        mappingStatus: 'mapped',
        mappingNotes: 'Direct mapping to target system Account object',
        requiresCustomization: false,
      },
      {
        legacyFeature: 'Contact',
        legacyFeatureType: 'custom_object',
        targetSystemFeature: 'Contact',
        mappingStatus: 'mapped',
        mappingNotes: 'Direct mapping to target system Contact object',
        requiresCustomization: false,
      },
      {
        legacyFeature: 'Opportunity',
        legacyFeatureType: 'custom_object',
        targetSystemFeature: 'Opportunity',
        mappingStatus: 'mapped',
        mappingNotes: 'Direct mapping to target system Opportunity object',
        requiresCustomization: false,
      },
      {
        legacyFeature: 'Invoice',
        legacyFeatureType: 'custom_object',
        targetSystemFeature: 'Invoice',
        mappingStatus: 'mapped',
        mappingNotes: 'Direct mapping to target system Invoice object',
        requiresCustomization: false,
      },
      {
        legacyFeature: 'InvoiceLine',
        legacyFeatureType: 'custom_object',
        targetSystemFeature: 'InvoiceLine',
        mappingStatus: 'mapped',
        mappingNotes: 'Direct mapping to target system InvoiceLine object',
        requiresCustomization: false,
      },
      {
        legacyFeature: 'TaxCalculation',
        legacyFeatureType: 'calculation_logic',
        targetSystemFeature: 'Custom Calculation Formula',
        mappingStatus: 'mapped',
        mappingNotes: 'Can be implemented as custom calculation formula in target system',
        requiresCustomization: false,
      },
    ]);
  });

  it('should return success status with complete function mapping', async () => {
    const input: Tx3Imp1AgentInput = {
      legacySystemAccessCredentials: {
        systemName: 'Salesforce',
        accessUrl: 'https://example.salesforce.com',
        apiKey: 'valid_api_key_12345',
      },
      targetSystemSpecification: {
        systemName: 'TargetERP',
        standardFeatures: [
          { featureName: 'Customer Management', description: 'Manage customers and contacts', apiEndpoint: '/api/v1/customers' },
          { featureName: 'Opportunity Management', description: 'Manage sales opportunities', apiEndpoint: '/api/v1/opportunities' },
          { featureName: 'Invoice Generation', description: 'Generate and manage invoices', apiEndpoint: '/api/v1/invoices' },
          { featureName: 'Custom Calculation Formula', description: 'Support custom calculation formulas', apiEndpoint: '/api/v1/calculations' },
        ],
        dataModel: [
          { objectName: 'Account', fields: [{ fieldName: 'accountId', fieldType: 'string' }, { fieldName: 'accountName', fieldType: 'string' }] },
          { objectName: 'Contact', fields: [{ fieldName: 'contactId', fieldType: 'string' }, { fieldName: 'contactName', fieldType: 'string' }] },
          { objectName: 'Opportunity', fields: [{ fieldName: 'opportunityId', fieldType: 'string' }, { fieldName: 'opportunityName', fieldType: 'string' }, { fieldName: 'amount', fieldType: 'decimal' }] },
          { objectName: 'Invoice', fields: [{ fieldName: 'invoiceId', fieldType: 'string' }, { fieldName: 'totalAmount', fieldType: 'decimal' }] },
          { objectName: 'InvoiceLine', fields: [{ fieldName: 'lineId', fieldType: 'string' }, { fieldName: 'amount', fieldType: 'decimal' }] },
        ],
        calculationCapabilities: [
          { calculationType: 'TaxCalculation', supportedOperations: ['multiply', 'add'] },
          { calculationType: 'DiscountCalculation', supportedOperations: ['multiply', 'subtract'] },
        ],
      },
      executionContext: {
        requestedBy: 'accounting_dept_user',
        requestedAt: '2026-10-07T10:00:00Z',
        priority: 'high',
      },
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('success');
    expect(result.legacySystemSpecification.customObjects).toHaveLength(5);
    expect(result.legacySystemSpecification.customObjects[0].objectName).toBe('Account');
    expect(result.legacySystemSpecification.customObjects[4].objectName).toBe('InvoiceLine');
    expect(result.legacySystemSpecification.dataflow).toHaveLength(5);
    expect(result.legacySystemSpecification.dataflow[0].stage).toBe(1);
    expect(result.legacySystemSpecification.dataflow[4].stage).toBe(5);

    expect(result.functionMappingTable).toHaveLength(6);
    result.functionMappingTable.forEach((mapping) => {
      expect(mapping.mappingStatus).toBe('mapped');
      expect(mapping.requiresCustomization).toBe(false);
    });

    expect(result.mappingValidationResult.isComplete).toBe(true);
    expect(result.mappingValidationResult.unmappedFeatures).toEqual([]);
    expect(result.mappingValidationResult.partiallyMappedFeatures).toEqual([]);

    expect(result.calculationLogicAnalysis).toBeDefined();
    const taxCalcAnalysis = result.calculationLogicAnalysis.find((a) => a.logicName === 'TaxCalculation');
    expect(taxCalcAnalysis).toBeDefined();

    expect(result.dataflowConsistencyAnalysis.isConsistent).toBe(true);
    expect(result.dataflowConsistencyAnalysis.inconsistencies).toEqual([]);

    expect(result.verificationDocument).toBeDefined();
    expect(['pdf', 'xlsx', 'html']).toContain(result.verificationDocument.documentFormat);
    expect(result.verificationDocument.documentUrl).toBeTruthy();
    expect(result.verificationDocument.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    expect(result.executionSummary.totalFeaturesAnalyzed).toBe(6);
    expect(result.executionSummary.mappedFeatures).toBe(6);
    expect(result.executionSummary.partiallyMappedFeatures).toBe(0);
    expect(result.executionSummary.unmappedFeatures).toBe(0);
    expect(result.executionSummary.customizationRequired).toBe(false);
    expect(result.executionSummary.estimatedCustomizationEffort).toBe('low');
    expect(result.executionSummary.warnings).toEqual([]);
    expect(result.executionSummary.errors).toEqual([]);
  });
});
