import { generateMappingTable, DataValidationError } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-039: DataValidationError - Input validation failure', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      hasAuthorization: true,
      userId,
    });

    (projectContextService.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      isAccessible: true,
    });

    // SCEN-039: Salesforceオブジェクト定義の検証失敗
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'SalesforceCustomObjectDefinition') {
        return Promise.resolve([
          {
            objectName: 'Invoice__c',
            fields: [
              { fieldName: 'Name', dataType: 'Text', isRequired: true },
              { fieldName: 'Amount__c', dataType: 'Currency', isRequired: true },
            ],
          },
        ]);
      }
      return Promise.resolve([]);
    });
  });

  it('should throw DataValidationError when field description is missing', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(DataValidationError);

    try {
      await generateMappingTable(input);
    } catch (e) {
      expect((e as Error).message).toBe(
        '入力データの検証に失敗しました。データの整合性を確認してください。'
      );
    }
  });
});
