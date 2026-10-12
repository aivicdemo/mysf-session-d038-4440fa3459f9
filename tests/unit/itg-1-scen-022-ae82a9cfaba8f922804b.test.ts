import { runTx3Imp1Agent, type Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';
import * as legacySystemMappingModule from '../../src/logic/legacy-system-mapping';

jest.mock('../../src/logic/legacy-system-mapping', () => ({
  ...jest.requireActual<typeof legacySystemMappingModule>('../../src/logic/legacy-system-mapping'),
  extractAndMapLegacySystemSpecification: jest.fn(),
  validateMappingCompleteness: jest.fn(),
  generateFunctionMappingTable: jest.fn(),
}));

describe('SCEN-022: 部分的なマッピング成功時に、マッピング済み機能と未マッピング機能を区別して記録し、partial_successステータスで返す', () => {
  let mockLegacySystemMapping: jest.Mocked<typeof legacySystemMappingModule>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLegacySystemMapping = legacySystemMappingModule as jest.Mocked<
      typeof legacySystemMappingModule
    >;
  });

  it('should return partial_success status with properly categorized mapping records', async () => {
    (mockLegacySystemMapping.extractAndMapLegacySystemSpecification as jest.Mock).mockResolvedValue(
      {
        customObjects: [
          {
            objectName: 'Invoice_Custom__c',
            fields: [
              { fieldName: 'invoiceNumber', fieldType: 'string', required: true },
              { fieldName: 'totalAmount', fieldType: 'currency', required: true },
              { fieldName: 'dealId', fieldType: 'string', required: true },
            ],
            calculationLogics: [
              {
                logicName: 'Calculate_Line_Total',
                formula: 'quantity * unitPrice * (1 - discountRate)',
              },
            ],
            references: [
              { referencedObject: 'Opportunity', relationshipType: 'lookup' },
            ],
          },
          {
            objectName: 'Invoice_Line_Item__c',
            fields: [
              { fieldName: 'lineItemId', fieldType: 'string', required: true },
              { fieldName: 'quantity', fieldType: 'number', required: true },
            ],
            calculationLogics: [
              {
                logicName: 'Calculate_Tax',
                formula: "IF(country='JP', lineTotal * 0.10, 0)",
              },
            ],
            references: [
              {
                referencedObject: 'Invoice_Custom__c',
                relationshipType: 'master_detail',
              },
            ],
          },
        ],
        dataflow: [
          {
            stage: 1,
            objectName: 'Invoice_Custom__c',
            generationTrigger: 'Opportunity.IsClosed=true',
          },
          {
            stage: 2,
            objectName: 'Invoice_Line_Item__c',
            generationTrigger: 'Invoice_Custom__c created',
          },
        ],
      },
    );

    (mockLegacySystemMapping.validateMappingCompleteness as jest.Mock).mockResolvedValue(
      {
        isComplete: false,
        unmappedFeatures: [
          {
            featureName: 'Calculate_Tax',
            featureType: 'calculation_logic',
            reason:
              'Target system does not support conditional tax calculation based on country field',
          },
        ],
        partiallyMappedFeatures: [
          {
            featureName: 'Invoice_Custom__c',
            mappedTo: 'Invoice',
            gaps: [
              'dealId field has no direct mapping in standard Invoice object',
              'Custom calculation logic for discounts not natively supported',
            ],
          },
          {
            featureName: 'Calculate_Line_Total',
            mappedTo: 'Sum calculation capability',
            gaps: [
              'Discount rate conditional calculation requires custom formula',
              'No native support for percentage-based calculations',
            ],
          },
        ],
      },
    );

    (mockLegacySystemMapping.generateFunctionMappingTable as jest.Mock).mockResolvedValue(
      [
        {
          legacyFeature: 'Invoice_Custom__c',
          legacyFeatureType: 'custom_object',
          targetSystemFeature: 'Invoice',
          mappingStatus: 'partial_mapped',
          mappingNotes:
            'Core invoice data maps to standard Invoice object. dealId field requires custom field addition.',
          requiresCustomization: true,
          customizationNotes:
            "Add custom field 'dealId' to Invoice object. Implement lookup relationship to SalesOrder.",
        },
        {
          legacyFeature: 'Invoice_Line_Item__c',
          legacyFeatureType: 'custom_object',
          targetSystemFeature: 'Invoice Line Item',
          mappingStatus: 'mapped',
          mappingNotes:
            'Line item structure maps well to standard invoice line model.',
          requiresCustomization: false,
        },
        {
          legacyFeature: 'Calculate_Line_Total',
          legacyFeatureType: 'calculation_logic',
          targetSystemFeature: 'Sum',
          mappingStatus: 'partial_mapped',
          mappingNotes:
            'Basic sum functionality available, but discount percentage logic requires enhancement.',
          requiresCustomization: true,
          customizationNotes:
            'Create custom formula field for (quantity * unitPrice * (1 - discountRate)).',
        },
        {
          legacyFeature: 'Calculate_Tax',
          legacyFeatureType: 'calculation_logic',
          targetSystemFeature: null,
          mappingStatus: 'unmapped',
          mappingNotes:
            'Conditional tax calculation based on country not supported in standard features.',
          requiresCustomization: true,
          customizationNotes:
            'Implement as workflow rule or custom business logic in application layer.',
        },
        {
          legacyFeature: 'Invoice generation on deal close',
          legacyFeatureType: 'dataflow',
          targetSystemFeature: 'Sales Order Processing',
          mappingStatus: 'partial_mapped',
          mappingNotes:
            'Order-to-cash flow maps to standard SalesOrder closure trigger, but custom object dependencies need verification.',
          requiresCustomization: true,
          customizationNotes:
            'Map Opportunity.IsClosed trigger to SalesOrder status change trigger. Verify data consistency.',
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
        accessUrl: 'https://example.salesforce.com',
        apiKey: 'valid_api_key_12345',
      },
      targetSystemSpecification: {
        systemName: 'TargetERP',
        standardFeatures: [
          {
            featureName: 'Invoice Management',
            description: 'Standard invoice generation',
            apiEndpoint: '/api/v1/invoices',
          },
          {
            featureName: 'Customer Master',
            description: 'Standard customer data',
            apiEndpoint: '/api/v1/customers',
          },
          {
            featureName: 'Sales Order Processing',
            description: 'Standard sales order handling',
            apiEndpoint: '/api/v1/salesorders',
          },
        ],
        dataModel: [
          {
            objectName: 'Customer',
            fields: [
              { fieldName: 'customerId', fieldType: 'string' },
              { fieldName: 'customerName', fieldType: 'string' },
            ],
          },
          {
            objectName: 'Invoice',
            fields: [
              { fieldName: 'invoiceId', fieldType: 'string' },
              { fieldName: 'customerId', fieldType: 'string' },
              { fieldName: 'invoiceAmount', fieldType: 'decimal' },
            ],
          },
        ],
        calculationCapabilities: [
          {
            calculationType: 'Sum',
            supportedOperations: ['field_sum', 'group_sum'],
          },
          {
            calculationType: 'Conditional',
            supportedOperations: ['if_then', 'switch_case'],
          },
        ],
      },
      executionContext: {
        requestedBy: 'accounting_manager_001',
        requestedAt: '2025-01-15T09:00:00Z',
        priority: 'high' as const,
      },
    };

    const result = await runTx3Imp1Agent(input, mockAiClient);

    expect(result.status).toBe('partial_success');

    expect(result.functionMappingTable).toHaveLength(5);
    const mappedCount = result.functionMappingTable.filter(
      (r) => r.mappingStatus === 'mapped',
    ).length;
    const partialMappedCount = result.functionMappingTable.filter(
      (r) => r.mappingStatus === 'partial_mapped',
    ).length;
    const unmappedCount = result.functionMappingTable.filter(
      (r) => r.mappingStatus === 'unmapped',
    ).length;

    expect(mappedCount).toBe(1);
    expect(partialMappedCount).toBe(3);
    expect(unmappedCount).toBe(1);

    const invoiceLineItem = result.functionMappingTable.find(
      (r) => r.legacyFeature === 'Invoice_Line_Item__c',
    );
    expect(invoiceLineItem?.mappingStatus).toBe('mapped');

    const invoiceCustom = result.functionMappingTable.find(
      (r) => r.legacyFeature === 'Invoice_Custom__c',
    );
    expect(invoiceCustom?.mappingStatus).toBe('partial_mapped');

    const calculateLineTotal = result.functionMappingTable.find(
      (r) => r.legacyFeature === 'Calculate_Line_Total',
    );
    expect(calculateLineTotal?.mappingStatus).toBe('partial_mapped');

    const invoiceGeneration = result.functionMappingTable.find(
      (r) => r.legacyFeature === 'Invoice generation on deal close',
    );
    expect(invoiceGeneration?.mappingStatus).toBe('partial_mapped');

    const calculateTax = result.functionMappingTable.find(
      (r) => r.legacyFeature === 'Calculate_Tax',
    );
    expect(calculateTax?.mappingStatus).toBe('unmapped');

    expect(result.mappingValidationResult.isComplete).toBe(false);
    expect(result.mappingValidationResult.unmappedFeatures).toHaveLength(1);
    expect(result.mappingValidationResult.unmappedFeatures[0].featureName).toBe(
      'Calculate_Tax',
    );
    expect(result.mappingValidationResult.partiallyMappedFeatures).toHaveLength(
      2,
    );

    expect(result.executionSummary.totalFeaturesAnalyzed).toBe(5);
    expect(result.executionSummary.mappedFeatures).toBe(1);
    expect(result.executionSummary.partiallyMappedFeatures).toBe(3);
    expect(result.executionSummary.unmappedFeatures).toBe(1);
    expect(result.executionSummary.customizationRequired).toBe(true);
    expect(result.executionSummary.estimatedCustomizationEffort).toBe('medium');

    expect(result.calculationLogicAnalysis).toHaveLength(2);
    const calculateLineTotalAnalysis = result.calculationLogicAnalysis.find(
      (a) => a.logicName === 'Calculate_Line_Total',
    );
    expect(calculateLineTotalAnalysis?.targetSystemCapability).toBe(
      'custom_formula_required',
    );

    const calculateTaxAnalysis = result.calculationLogicAnalysis.find(
      (a) => a.logicName === 'Calculate_Tax',
    );
    expect(calculateTaxAnalysis?.targetSystemCapability).toBe('not_supported');

    expect(result.verificationDocument.documentFormat).toMatch(/^(xlsx|pdf)$/);
    expect(result.verificationDocument.documentUrl).toBeTruthy();

    expect(result.executionSummary.warnings.length).toBeGreaterThan(0);
    expect(
      result.executionSummary.warnings.some((w) =>
        w.includes('部分的なマッピング'),
      ),
    ).toBe(true);
    expect(result.executionSummary.errors).toHaveLength(0);
  });
});
