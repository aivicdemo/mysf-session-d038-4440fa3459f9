import { generateMappingTable, ObjectReferenceRelationshipIncompleteError } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as projectContextService from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-037: ObjectReferenceRelationshipIncompleteError - Missing reference details', () => {
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
      userHasAccess: true,
    });

    // SCEN-037: オブジェクト間参照関係の定義が空
    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === 'ObjectReferenceRelationship') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });
  });

  it('should throw ObjectReferenceRelationshipIncompleteError when relationship definitions are empty', async () => {
    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(
      ObjectReferenceRelationshipIncompleteError
    );

    try {
      await generateMappingTable(input);
    } catch (e) {
      expect((e as Error).message).toBe(
        'オブジェクト間参照関係の定義が不完全です。参照関係を確認してください。'
      );
    }
  });
});
