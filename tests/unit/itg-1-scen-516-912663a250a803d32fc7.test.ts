import {
  extractAndMapLegacySystemSpecification,
  SalesforceConnectionError,
  CustomObjectNotFoundError,
  TargetSystemSpecificationInvalidError,
  MappingValidationFailedError,
  type ExtractAndMapLegacySystemSpecificationInput,
  type ExtractAndMapLegacySystemSpecificationOutput,
  type SalesforceEnvironmentContext,
  type TargetSystemSpecification,
} from '../../src/logic/legacy-system-mapping';
import type { ExecutionContext } from '../../src/logic/invoice-output-validation';

describe('SCEN-516: Salesforce custom object mapping - normal case', () => {
  it('should extract and map Salesforce objects successfully when all inputs are valid', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'valid_token_12345',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: 'TargetBillingSystem',
      standardDataModel: {
        entities: [
          {
            entityName: 'Invoice',
            attributes: ['invoiceNumber', 'customerId', 'amount', 'date', 'status'],
          },
          {
            entityName: 'InvoiceLineItem',
            attributes: ['lineId', 'invoiceId', 'description', 'quantity', 'unitPrice', 'amount'],
          },
        ],
      },
      apiSpecification: {
        endpoints: [
          {
            path: '/api/billing/invoice',
            method: 'GET',
            description: 'Retrieve invoices',
          },
          {
            path: '/api/billing/line-items',
            method: 'GET',
            description: 'Retrieve line items',
          },
        ],
      },
      supportedFeatures: ['BillingModule'],
    };

    const executionContext: ExecutionContext = {
      userId: 'user_accounting_dept_001',
      executionTimestamp: '2026-10-15T10:30:00Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    const result: ExtractAndMapLegacySystemSpecificationOutput = await extractAndMapLegacySystemSpecification(input);

    expect(result).toBeDefined();
    expect(result.customObjectSpecificationDocument).toBeDefined();
    expect(result.customObjectSpecificationDocument.invoiceObjectSpec).toBeDefined();
    expect(result.customObjectSpecificationDocument.invoiceLineItemObjectSpec).toBeDefined();
    expect(result.customObjectSpecificationDocument.invoiceObjectSpec.objectName).toBe('Invoice__c');
    expect(result.customObjectSpecificationDocument.invoiceLineItemObjectSpec.objectName).toBe('InvoiceLine__c');

    expect(result.functionMappingTable).toBeInstanceOf(Array);
    expect(result.functionMappingTable.length).toBeGreaterThan(0);
    expect(result.functionMappingTable[0]).toHaveProperty('salesforceFeature');
    expect(result.functionMappingTable[0]).toHaveProperty('mappingStatus');

    expect(result.mappingValidationResult).toBeDefined();
    expect(result.mappingValidationResult.isComplete).toBe(true);
    expect(result.mappingValidationResult.totalUnmappedFeatures).toBe(0);
    expect(result.mappingValidationResult.validationErrors).toEqual([]);

    expect(result.generatedAt).toBeInstanceOf(Date);
  });
});

describe('SCEN-517: Salesforce connection error', () => {
  it('should throw SalesforceConnectionError when connection info is invalid', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://invalid-instance.salesforce.com',
      accessToken: 'invalid_token_format',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: '移行対象システム',
      standardDataModel: {
        entities: [
          { entityName: 'Account', attributes: ['id', 'name', 'billingCity'] },
          { entityName: 'Opportunity', attributes: ['id', 'accountId', 'amount', 'stageName'] },
        ],
      },
      apiSpecification: {
        endpoints: [],
      },
      supportedFeatures: [],
    };

    const executionContext: ExecutionContext = {
      userId: 'user-12345',
      executionTimestamp: '2026-10-07T10:30:00.000Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      SalesforceConnectionError
    );

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      'Salesforce環境に接続できません。接続情報を確認してください。'
    );
  });
});

describe('SCEN-518: Custom object not found error', () => {
  it('should throw CustomObjectNotFoundError when custom objects do not exist', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'valid_token_12345',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: '移行対象システム',
      standardDataModel: {
        entities: [
          { entityName: 'Account', attributes: ['id', 'name', 'billingCity'] },
          { entityName: 'Opportunity', attributes: ['id', 'accountId', 'amount', 'stageName'] },
        ],
      },
      apiSpecification: {
        endpoints: [],
      },
      supportedFeatures: [],
    };

    const executionContext: ExecutionContext = {
      userId: 'user_001',
      executionTimestamp: '2026-10-07T10:30:00Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      CustomObjectNotFoundError
    );

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      '指定されたカスタムオブジェクト（請求書・請求明細）がSalesforce環境に見つかりません。'
    );
  });
});

describe('SCEN-519: Target system specification invalid error', () => {
  it('should throw TargetSystemSpecificationInvalidError when target system spec is invalid', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'valid_token_12345',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: '移行対象システム',
      standardDataModel: {
        entities: [],
      },
      apiSpecification: {
        endpoints: [],
      },
      supportedFeatures: [],
    };

    const executionContext: ExecutionContext = {
      userId: '005D0000001IZ3A',
      executionTimestamp: '2024-01-15T10:30:00Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      TargetSystemSpecificationInvalidError
    );

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      '移行対象システムの仕様定義が不正です。必須項目を確認してください。'
    );
  });
});

describe('SCEN-520: Mapping validation failed error', () => {
  it('should throw MappingValidationFailedError when mapping validation fails', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'valid_token_12345',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: '移行対象システムA',
      standardDataModel: {
        entities: [
          {
            entityName: 'Invoice',
            attributes: ['id', 'number', 'date', 'amount', 'status'],
          },
        ],
      },
      apiSpecification: {
        endpoints: [
          {
            path: '/invoices',
            method: 'POST',
            description: 'Create invoice',
          },
        ],
      },
      supportedFeatures: ['請求書作成'],
    };

    const executionContext: ExecutionContext = {
      userId: 'user_12345',
      executionTimestamp: '2026-10-07T10:30:00Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      MappingValidationFailedError
    );

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      '機能マッピングの検証に失敗しました。詳細はマッピング表を確認してください。'
    );
  });
});

describe('SCEN-522: Business rule validation - Salesforce auth constraint 1', () => {
  it('should throw SalesforceConnectionError with specific message when auth fails', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'invalid_token_xyz',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: '移行対象ERP',
      standardDataModel: {
        entities: [
          {
            entityName: 'Invoice',
            attributes: ['id', 'invoiceNumber', 'customerId', 'totalAmount'],
          },
        ],
      },
      apiSpecification: {
        endpoints: [
          {
            path: '/api/invoices',
            method: 'POST',
            description: 'Create invoice',
          },
        ],
      },
      supportedFeatures: ['請求書管理'],
    };

    const executionContext: ExecutionContext = {
      userId: 'migration_operator@company.example.com',
      executionTimestamp: '2024-10-07T10:30:00Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      SalesforceConnectionError
    );

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      'Salesforce環境に接続できません。接続情報を確認してください。'
    );
  });
});

describe('SCEN-523: Business rule validation - Custom object not found constraint 2', () => {
  it('should throw CustomObjectNotFoundError when objects do not exist', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test-org.salesforce.com',
      accessToken: 'valid-token',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: 'TargetERP',
      standardDataModel: {
        entities: [
          { entityName: 'Customer', attributes: ['id', 'name', 'type'] },
          { entityName: 'Order', attributes: ['id', 'customerId', 'amount', 'status'] },
        ],
      },
      apiSpecification: {
        endpoints: [
          { path: 'POST /api/invoices', method: 'POST', description: 'Create invoice' },
          { path: 'GET /api/invoices/{id}', method: 'GET', description: 'Get invoice' },
        ],
      },
      supportedFeatures: [],
    };

    const executionContext: ExecutionContext = {
      userId: 'user-789',
      executionTimestamp: '2026-10-07T06:22:11.338Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      CustomObjectNotFoundError
    );

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      '指定されたカスタムオブジェクトが見つかりません。API名を確認してください'
    );
  });
});

describe('SCEN-524: Business rule validation - Calculation logic retrieval warning', () => {
  it('should return output with warning when calculation logic retrieval fails', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'valid_token_12345',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: 'TargetERP',
      standardDataModel: {
        entities: [
          { entityName: 'Invoice', attributes: ['id', 'amount', 'date'] },
        ],
      },
      apiSpecification: {
        endpoints: [],
      },
      supportedFeatures: ['invoiceGeneration', 'lineItemManagement'],
    };

    const executionContext: ExecutionContext = {
      userId: 'user001',
      executionTimestamp: '2026-10-07T06:22:11.338Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    const result = await extractAndMapLegacySystemSpecification(input);

    expect(result).toBeDefined();
    expect(result.mappingValidationResult).toBeDefined();
    expect(result.mappingValidationResult.validationErrors).toContain(
      '一部の計算ロジック定義が取得できませんでした。手動で確認してください'
    );
  });
});

describe('SCEN-525: Business rule validation - Cyclic reference warning', () => {
  it('should return output with cyclic reference warning', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'valid_token_12345',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: '移行対象システム',
      standardDataModel: {
        entities: [
          { entityName: 'invoice', attributes: ['id', 'amount', 'date'] },
          { entityName: 'invoiceLine', attributes: ['id', 'amount', 'quantity'] },
        ],
      },
      apiSpecification: {
        endpoints: [],
      },
      supportedFeatures: ['invoiceGeneration', 'lineItemManagement'],
    };

    const executionContext: ExecutionContext = {
      userId: 'accounting-user-001',
      executionTimestamp: '2026-10-15T10:30:00Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    const result = await extractAndMapLegacySystemSpecification(input);

    expect(result).toBeDefined();
    expect(result.mappingValidationResult).toBeDefined();
    expect(result.mappingValidationResult.validationErrors).toContain(
      'オブジェクト間に循環参照が存在します。移行時に注意が必要です'
    );
  });
});

describe('SCEN-526: Business rule validation - 7-object relationship mapping', () => {
  it('should map 7-object relationship hierarchy correctly', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'valid_token_12345',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: 'NextGen ERP',
      standardDataModel: {
        entities: [
          { entityName: 'Customer', attributes: ['id', 'name', 'email', 'billingAddress'] },
          { entityName: 'Contact', attributes: ['id', 'customerId', 'name', 'email'] },
          { entityName: 'Order', attributes: ['id', 'customerId', 'amount', 'status', 'orderDate'] },
          { entityName: 'OrderLineItem', attributes: ['id', 'orderId', 'quantity', 'price', 'total'] },
          { entityName: 'Invoice', attributes: ['id', 'orderId', 'amount', 'date', 'status'] },
          { entityName: 'InvoiceLineItem', attributes: ['id', 'invoiceId', 'orderLineItemId', 'quantity', 'price'] },
        ],
      },
      apiSpecification: {
        endpoints: [
          { path: '/api/v1/invoices/generate', method: 'POST', description: 'Generate invoice' },
          { path: '/api/v1/invoiceLineItems/mapFromOrder', method: 'POST', description: 'Map line items' },
        ],
      },
      supportedFeatures: [],
    };

    const executionContext: ExecutionContext = {
      userId: '005D0000001IZ3Z',
      executionTimestamp: '2024-01-15T10:30:00Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    const result = await extractAndMapLegacySystemSpecification(input);

    expect(result).toBeDefined();
    expect(result.customObjectSpecificationDocument).toBeDefined();
    expect(result.functionMappingTable).toBeInstanceOf(Array);
    expect(result.mappingValidationResult.isComplete).toBe(true);
    expect(result.generatedAt).toBeInstanceOf(Date);
  });
});

describe('SCEN-527: Business rule validation - Account object schema not found', () => {
  it('should throw error when Account object schema is not found', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'valid_token_12345',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: 'NextGen ERP System',
      standardDataModel: {
        entities: [
          { entityName: 'Customer', attributes: ['id', 'name', 'type'] },
        ],
      },
      apiSpecification: {
        endpoints: [
          { path: '/api/customers', method: 'GET', description: 'Get customers' },
        ],
      },
      supportedFeatures: ['CustomerMaster', 'OrderManagement', 'InvoiceGeneration'],
    };

    const executionContext: ExecutionContext = {
      userId: 'system_user_001',
      executionTimestamp: '2026-10-07T10:30:00Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      CustomObjectNotFoundError
    );

    await expect(extractAndMapLegacySystemSpecification(input)).rejects.toThrow(
      '取引先オブジェクトの定義が見つかりません。Salesforce環境を確認してください'
    );
  });
});

describe('SCEN-528: Business rule validation - Invoice not linked to Opportunity warning', () => {
  it('should return warning when Invoice is not linked to Opportunity', async () => {
    const salesforceEnvironmentContext: SalesforceEnvironmentContext = {
      instanceUrl: 'https://test.salesforce.com',
      accessToken: 'valid-token-123',
      invoiceCustomObjectName: 'Invoice__c',
      invoiceLineItemCustomObjectName: 'InvoiceLine__c',
    };

    const targetSystemSpecification: TargetSystemSpecification = {
      systemName: '移行対象システム',
      standardDataModel: {
        entities: [
          { entityName: 'Account', attributes: ['id', 'name', 'email'] },
          { entityName: 'Contact', attributes: ['id', 'name', 'email'] },
          { entityName: 'Opportunity', attributes: ['id', 'name', 'amount'] },
        ],
      },
      apiSpecification: {
        endpoints: [
          { path: '/api/invoices', method: 'POST', description: 'Create invoice' },
        ],
      },
      supportedFeatures: [],
    };

    const executionContext: ExecutionContext = {
      userId: 'sys-user-001',
      executionTimestamp: '2026-01-15T09:30:00Z',
      sessionId: 'session-001',
    };

    const input: ExtractAndMapLegacySystemSpecificationInput = {
      salesforceEnvironmentContext,
      targetSystemSpecification,
      executionContext,
    };

    const result = await extractAndMapLegacySystemSpecification(input);

    expect(result).toBeDefined();
    expect(result.mappingValidationResult).toBeDefined();
    expect(result.mappingValidationResult.validationErrors).toContain(
      '請求書が商談と紐付いていません。カスタマイズ構成を確認してください'
    );
  });
});
