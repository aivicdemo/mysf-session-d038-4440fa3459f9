import { extractAndMapLegacySystemSpecification } from '../../src/logic/legacy-system-mapping';
import type {
  ExtractAndMapLegacySystemSpecificationInput,
  ExtractAndMapLegacySystemSpecificationOutput,
  SalesforceEnvironmentContext,
  TargetSystemSpecification,
  FunctionMappingTableRecord,
} from '../../src/logic/legacy-system-mapping';
import type { ExecutionContext } from '../../src/logic/invoice-output-validation';

describe('SCEN-530: 請求明細カスタムオブジェクトの複数参照元の警告検出', () => {
  it('請求明細が複数の参照元を持つとき、警告を記録する', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://example.salesforce.com',
      accessToken: 'valid-token',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: 'target-erp',
      standardDataModel: {
        entities: [
          {
            entityName: 'Invoice',
            attributes: ['id', 'amount', 'status'],
          },
          {
            entityName: 'LineItem',
            attributes: ['id', 'invoice_id', 'quantity', 'unit_price'],
          },
        ],
      },
      apiSpecification: {
        endpoints: [
          {
            path: '/invoices',
            method: 'POST',
            description: '請求書を作成する',
          },
        ],
      },
      supportedFeatures: ['invoice-management', 'line-item-tracking'],
    };

    const executionContext: ExecutionContext = {
      userId: 'user-accounting-001',
      executionTimestamp: '2026-10-07T10:00:00Z',
      sessionId: 'session-accounting-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    const result: ExtractAndMapLegacySystemSpecificationOutput = await extractAndMapLegacySystemSpecification(input);

    expect(result.customObjectSpecificationDocument).toBeDefined();
    expect(result.customObjectSpecificationDocument.invoiceLineItemObjectSpec).toBeDefined();
    expect(result.customObjectSpecificationDocument.invoiceLineItemObjectSpec.relationships).toBeDefined();

    const invoiceLineRelationships = result.customObjectSpecificationDocument.invoiceLineItemObjectSpec.relationships;
    expect(invoiceLineRelationships.length).toBeGreaterThanOrEqual(2);

    const invoiceRef = invoiceLineRelationships.find(
      rel => rel.referencedObjectName === 'Invoice__c' || rel.referencedObjectName === 'Invoice'
    );
    const opportunityLineItemRef = invoiceLineRelationships.find(
      rel => rel.referencedObjectName === 'OpportunityLineItem'
    );
    expect(invoiceRef).toBeDefined();
    expect(opportunityLineItemRef).toBeDefined();

    expect(result.mappingValidationResult).toBeDefined();
    const warnings = (result.mappingValidationResult as any).warnings;
    expect(warnings).toBeDefined();
    expect(Array.isArray(warnings)).toBe(true);

    const multiSourceWarning = warnings.find(
      (w: any) => w.message === '請求明細の参照元が複数です。データ整合性チェックが必要です'
    );
    expect(multiSourceWarning).toBeDefined();
    expect(multiSourceWarning.severity).toBe('warn');

    expect(result.functionMappingTable).toBeDefined();
    expect(Array.isArray(result.functionMappingTable)).toBe(true);

    const multiRefRecord = result.functionMappingTable.find(
      (record: FunctionMappingTableRecord) =>
        record.notes && record.notes.includes('請求明細の参照元が複数')
    );
    expect(multiRefRecord).toBeDefined();

    expect(result.generatedAt).toBeDefined();
    expect(new Date(result.generatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(executionContext.executionTimestamp).getTime()
    );
  });
});
