import { extractAndMapLegacySystemSpecification } from '../../src/logic/legacy-system-mapping';
import type {
  ExtractAndMapLegacySystemSpecificationInput,
  ExtractAndMapLegacySystemSpecificationOutput,
} from '../../src/logic/legacy-system-mapping';

describe('SCEN-521: extractAndMapLegacySystemSpecification - Salesforce schema extraction and mapping', () => {
  it('should extract Salesforce custom object schema and generate mapping to target system', async () => {
    // Precondition: salesforceEnvironmentContext
    const salesforceEnvironmentContext = {
      instanceUrl: 'https://instance.salesforce.com',
      accessToken: 'valid_token_12345',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    // Precondition: targetSystemSpecification
    const targetSystemSpecification = {
      systemName: 'NextGenERPSystem',
      standardDataModel: {
        entities: [
          {
            entityName: 'Invoices',
            attributes: ['invoice_id', 'account_id', 'total_amount', 'tax_amount', 'invoice_date', 'due_date', 'status'],
          },
          {
            entityName: 'InvoiceLines',
            attributes: ['line_id', 'invoice_id', 'product_id', 'quantity', 'unit_price', 'line_total'],
          },
        ],
      },
      apiSpecification: {
        endpoints: [
          { path: '/invoices', method: 'POST', description: 'Create invoice' },
          { path: '/invoice-lines', method: 'POST', description: 'Create invoice line' },
        ],
      },
      supportedFeatures: ['MasterDetailRelationship', 'LookupRelationship', 'Formula', 'RollupSummary'],
    };

    // Precondition: executionContext
    const executionContext = {
      userId: 'user_12345',
      executionTimestamp: '2024-01-15T10:30:00Z',
      userRole: 'SystemAdministrator',
      permissions: ['READ_SALESFORCE_METADATA', 'ACCESS_CUSTOM_OBJECTS'],
    } as any;

    // Precondition: currentSalesforceEnvironment (embedded in the request)
    const currentSalesforceEnvironment = {
      customObjects: [
        {
          name: 'Invoice__c',
          label: '請求書',
          fields: [
            { name: 'Name', label: '請求書番号', type: 'Text', required: true, length: 50 },
            { name: 'Amount__c', label: '請求金額', type: 'Currency', required: true, precision: 16, scale: 2 },
            { name: 'Opportunity__c', label: '商談', type: 'Lookup', referenceTo: 'Opportunity', required: true },
            { name: 'InvoiceDate__c', label: '請求日', type: 'Date', required: true },
            { name: 'DueDate__c', label: '支払期日', type: 'Date', required: false },
            {
              name: 'Status__c',
              label: 'ステータス',
              type: 'Picklist',
              required: true,
              picklistValues: ['Draft', 'Issued', 'Paid', 'Overdue', 'Cancelled'],
            },
          ],
          childRelationships: [{ relationshipName: 'InvoiceLines__r', childObjectName: 'InvoiceLine__c', cascadeDelete: true }],
        },
        {
          name: 'InvoiceLine__c',
          label: '請求明細',
          fields: [
            { name: 'Name', label: '明細番号', type: 'Text', required: true, length: 50 },
            { name: 'Invoice__c', label: '請求書', type: 'MasterDetail', referenceTo: 'Invoice__c', required: true },
            { name: 'OpportunityLineItem__c', label: '商談商品', type: 'Lookup', referenceTo: 'OpportunityLineItem', required: false },
            { name: 'Quantity__c', label: '数量', type: 'Number', required: true, precision: 10, scale: 2 },
            { name: 'UnitPrice__c', label: '単価', type: 'Currency', required: true, precision: 16, scale: 2 },
            { name: 'LineTotal__c', label: '小計', type: 'Currency', required: false, precision: 16, scale: 2 },
          ],
        },
      ],
      calculationFormulas: [
        { objectName: 'Invoice__c', fieldName: 'Amount__c', type: 'RollupSummary', definition: 'SUM of InvoiceLines__r.LineTotal__c', sequence: 1 },
        { objectName: 'InvoiceLine__c', fieldName: 'LineTotal__c', type: 'Formula', definition: 'Quantity__c * UnitPrice__c', sequence: 0 },
      ],
      validationRules: [
        { objectName: 'Invoice__c', name: 'ValidateInvoiceDateRule', definition: 'InvoiceDate__c > TODAY()', message: '請求日は本日以降である必要があります' },
        { objectName: 'InvoiceLine__c', name: 'ValidateLineQuantityRule', definition: 'Quantity__c > 0', message: '数量は0より大きい必要があります' },
      ],
    } as any;

    // Build input for extractAndMapLegacySystemSpecification
    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
      ...currentSalesforceEnvironment,
    } as any;

    // Call the function being tested
    const result: ExtractAndMapLegacySystemSpecificationOutput = await extractAndMapLegacySystemSpecification(input);

    // Verify customObjectSpecificationDocument is returned
    expect(result.customObjectSpecificationDocument).toBeDefined();

    // Verify invoiceObjectSpec contains Invoice__c schema with required fields
    const invoiceSpec = result.customObjectSpecificationDocument.invoiceObjectSpec;
    expect(invoiceSpec).toBeDefined();
    expect(invoiceSpec.objectName).toBe('Invoice__c');

    // Check that required fields (Name, Amount__c, Opportunity__c, InvoiceDate__c, Status__c) are present and marked as required
    const requiredInvoiceFields = ['Name', 'Amount__c', 'Opportunity__c', 'InvoiceDate__c', 'Status__c'];
    requiredInvoiceFields.forEach(fieldName => {
      const field = invoiceSpec.fields.find(f => f.fieldName === fieldName);
      expect(field).toBeDefined();
      expect(field?.isRequired).toBe(true);
    });

    // Check optional field DueDate__c
    const dueDateField = invoiceSpec.fields.find(f => f.fieldName === 'DueDate__c');
    expect(dueDateField).toBeDefined();
    expect(dueDateField?.isRequired).toBe(false);

    // Verify field data types
    expect(invoiceSpec.fields.find(f => f.fieldName === 'Name')?.dataType).toBe('Text');
    expect(invoiceSpec.fields.find(f => f.fieldName === 'Amount__c')?.dataType).toBe('Currency');
    expect(invoiceSpec.fields.find(f => f.fieldName === 'Opportunity__c')?.dataType).toBe('Lookup');
    expect(invoiceSpec.fields.find(f => f.fieldName === 'InvoiceDate__c')?.dataType).toBe('Date');
    expect(invoiceSpec.fields.find(f => f.fieldName === 'Status__c')?.dataType).toBe('Picklist');

    // Verify invoiceLineItemObjectSpec contains InvoiceLine__c schema
    const invoiceLineSpec = result.customObjectSpecificationDocument.invoiceLineItemObjectSpec;
    expect(invoiceLineSpec).toBeDefined();
    expect(invoiceLineSpec.objectName).toBe('InvoiceLine__c');

    // Check that required fields (Name, Invoice__c, Quantity__c, UnitPrice__c) are present and marked as required
    const requiredLineFields = ['Name', 'Invoice__c', 'Quantity__c', 'UnitPrice__c'];
    requiredLineFields.forEach(fieldName => {
      const field = invoiceLineSpec.fields.find(f => f.fieldName === fieldName);
      expect(field).toBeDefined();
      expect(field?.isRequired).toBe(true);
    });

    // Check optional fields
    const opptyLineField = invoiceLineSpec.fields.find(f => f.fieldName === 'OpportunityLineItem__c');
    expect(opptyLineField).toBeDefined();
    expect(opptyLineField?.isRequired).toBe(false);

    const lineTotalField = invoiceLineSpec.fields.find(f => f.fieldName === 'LineTotal__c');
    expect(lineTotalField).toBeDefined();
    expect(lineTotalField?.isRequired).toBe(false);

    // Verify field data types
    expect(invoiceLineSpec.fields.find(f => f.fieldName === 'Name')?.dataType).toBe('Text');
    expect(invoiceLineSpec.fields.find(f => f.fieldName === 'Invoice__c')?.dataType).toBe('MasterDetail');
    expect(invoiceLineSpec.fields.find(f => f.fieldName === 'Quantity__c')?.dataType).toBe('Number');
    expect(invoiceLineSpec.fields.find(f => f.fieldName === 'UnitPrice__c')?.dataType).toBe('Currency');
    expect(invoiceLineSpec.fields.find(f => f.fieldName === 'LineTotal__c')?.dataType).toBe('Currency');

    // Verify dataFlowDiagram is populated
    expect(result.customObjectSpecificationDocument.dataFlowDiagram).toBeDefined();
    expect(Array.isArray(result.customObjectSpecificationDocument.dataFlowDiagram.flowSequence)).toBe(true);
    expect(Array.isArray(result.customObjectSpecificationDocument.dataFlowDiagram.objectDependencies)).toBe(true);

    // Verify calculationLogicDefinition contains both formula and rollup summary
    expect(result.customObjectSpecificationDocument.calculationLogicDefinition).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          objectName: 'InvoiceLine__c',
          fieldName: 'LineTotal__c',
          logicDescription: expect.any(String),
          formula: 'Quantity__c * UnitPrice__c',
        }),
        expect.objectContaining({
          objectName: 'Invoice__c',
          fieldName: 'Amount__c',
          logicDescription: expect.any(String),
          formula: 'SUM of InvoiceLines__r.LineTotal__c',
        }),
      ])
    );

    // Verify functionMappingTable is a non-empty array
    expect(result.functionMappingTable).toBeDefined();
    expect(Array.isArray(result.functionMappingTable)).toBe(true);
    expect(result.functionMappingTable.length).toBeGreaterThan(0);

    // Verify that mappings for key fields exist in the table
    // According to specification, must include:
    // 1. Invoice__c.Amount__c → Invoices.total_amount
    // 2. Invoice__c.Opportunity__c → Invoices.account_id
    // 3. InvoiceLine__c.LineTotal__c → InvoiceLines.line_total
    const tableRecords = result.functionMappingTable;
    expect(tableRecords.length).toBeGreaterThanOrEqual(3);

    // Each record should have mappingStatus of MAPPED for the key fields
    const mappedRecords = tableRecords.filter(r => r.mappingStatus === 'MAPPED');
    expect(mappedRecords.length).toBeGreaterThanOrEqual(3);

    // Verify mappingValidationResult indicates complete and valid mapping
    expect(result.mappingValidationResult).toBeDefined();
    expect(result.mappingValidationResult.isComplete).toBe(true);
    expect(result.mappingValidationResult.totalMappedFeatures).toBeGreaterThan(0);
    expect(result.mappingValidationResult.totalUnmappedFeatures).toBe(0);
    expect(result.mappingValidationResult.partialMappingCount).toBe(0);
    expect(result.mappingValidationResult.validationErrors).toEqual([]);
    expect(result.mappingValidationResult.warnings).toHaveLength(0);

    // Verify generatedAt matches executionContext timestamp
    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt).toEqual(new Date('2024-01-15T10:30:00Z'));
  });
});
