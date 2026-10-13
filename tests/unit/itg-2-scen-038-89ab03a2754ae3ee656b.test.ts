import { generateMappingTable, StandardFunctionDefinitionIncompleteError } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-038: StandardFunctionDefinitionIncompleteError - Missing function details', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      authenticated: true,
      authorized: true,
    });

    (projectContextService.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      valid: true,
      userHasAccess: true,
    });

    // SCEN-038: 標準機能定義が不完全
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'StandardFunctionDefinition') {
        return Promise.resolve([
          {
            functionId: 'func-001',
            functionName: null,
            description: null,
            category: null,
          },
        ]);
      }
      return Promise.resolve([]);
    });
  });

  it('should throw StandardFunctionDefinitionIncompleteError when functionName is null', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(
      StandardFunctionDefinitionIncompleteError
    );

    try {
      await generateMappingTable(input);
    } catch (e) {
      expect((e as Error).message).toBe(
        '移行対象システムの標準機能定義が不完全です。システムの標準機能を確認してください。'
      );
    }
  });
});
