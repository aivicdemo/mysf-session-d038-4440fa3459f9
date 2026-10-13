import { generateMappingTable, SalesforceObjectDefinitionIncompleteError } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-035: SalesforceObjectDefinitionIncompleteError - Missing required field', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      isAuthenticated: true,
      hasPermission: true,
    });

    (projectContextService.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      isValid: true,
    });

    // SCEN-035: InvoiceLineItem__c の LineItemAmount__c フィールドの必須属性が欠落
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'SalesforceCustomObjectDefinition') {
        return Promise.resolve([
          {
            objectName: 'Invoice__c',
            fields: [
              { fieldName: 'InvoiceNumber__c', fieldType: 'Text', isRequired: true },
              { fieldName: 'InvoiceDate__c', fieldType: 'Date', isRequired: true },
            ],
          },
          {
            objectName: 'InvoiceLineItem__c',
            fields: [
              { fieldName: 'LineItemAmount__c', fieldType: 'Currency', isRequired: null },
            ],
          },
        ]);
      }
      return Promise.resolve([]);
    });
  });

  it('should throw SalesforceObjectDefinitionIncompleteError when InvoiceLineItem__c has null isRequired field', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(
      SalesforceObjectDefinitionIncompleteError
    );

    const error = new Error();
    try {
      await generateMappingTable(input);
    } catch (e) {
      expect((e as Error).message).toBe(
        'Salesforceオブジェクト定義が不完全です。請求書・請求明細の構造定義を確認してください。'
      );
    }
  });
});
