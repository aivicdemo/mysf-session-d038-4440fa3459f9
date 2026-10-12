import { extractAndMapLegacySystemSpecification } from '../../src/logic/legacy-system-mapping';
import type {
  ExtractAndMapLegacySystemSpecificationInput,
  ExtractAndMapLegacySystemSpecificationOutput,
  SalesforceEnvironmentContext,
  TargetSystemSpecification,
  CustomObjectSpecificationDocument,
  FunctionMappingTableRecord,
  MappingValidationResult,
} from '../../src/logic/legacy-system-mapping';
import type { ExecutionContext } from '../../src/logic/invoice-output-validation';

describe('SCEN-529: 複数参照ルートの警告検出', () => {
  it('商談から請求書への複数参照ルートを検出し、警告を記録する', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://example.salesforce.com',
      accessToken: 'valid_token_12345',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: 'TargetERP',
      standardDataModel: {
        entities: [
          {
            entityName: 'Invoice',
            attributes: ['id', 'opportunityId', 'amount'],
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
      supportedFeatures: ['invoice-management'],
    };

    const executionContext: ExecutionContext = {
      userId: 'user_12345',
      executionTimestamp: '2026-10-07T10:00:00Z',
      sessionId: 'session_12345',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    const result: ExtractAndMapLegacySystemSpecificationOutput = await extractAndMapLegacySystemSpecification(input);

    expect(result.customObjectSpecificationDocument).toBeDefined();
    expect(result.customObjectSpecificationDocument.invoiceObjectSpec).toBeDefined();
    expect(result.customObjectSpecificationDocument.invoiceObjectSpec.relationships).toBeDefined();

    const invoiceRelationships = result.customObjectSpecificationDocument.invoiceObjectSpec.relationships;
    const opportunityReferences = invoiceRelationships.filter(
      rel => rel.referencedObjectName === 'Opportunity'
    );
    expect(opportunityReferences.length).toBe(3);

    expect(result.functionMappingTable).toBeDefined();
    expect(Array.isArray(result.functionMappingTable)).toBe(true);

    expect(result.mappingValidationResult).toBeDefined();
    const warnings = (result.mappingValidationResult as any).warnings;
    expect(warnings).toBeDefined();
    expect(Array.isArray(warnings)).toBe(true);

    const multiRefWarning = warnings.find(
      (w: any) => w.message === '複数の参照ルートが検出されました。請求書生成ロジックの確認が必要です'
    );
    expect(multiRefWarning).toBeDefined();
    expect(multiRefWarning.severity).toBe('warn');

    expect(result.generatedAt).toBeDefined();
    expect(new Date(result.generatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(executionContext.executionTimestamp).getTime()
    );
  });
});
