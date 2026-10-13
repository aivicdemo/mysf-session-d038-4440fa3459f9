import { generateMappingTable, SalesforceObjectDefinitionIncompleteError } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-042: br-tx_3-004 - Empty Salesforce object definition', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
    });

    (projectContextService.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
    });

    // SCEN-042: Salesforceカスタムオブジェクト定義が空
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'SalesforceCustomObjectDefinition') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });
  });

  it('should throw SalesforceObjectDefinitionIncompleteError when object structure is empty', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(
      SalesforceObjectDefinitionIncompleteError
    );

    try {
      await generateMappingTable(input);
    } catch (e) {
      expect((e as Error).message).toBe(
        'Salesforceの請求書・請求明細オブジェクトの構造が未入力です。先に文書化を完了してください'
      );
    }
  });
});
