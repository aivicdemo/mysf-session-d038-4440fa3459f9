import { generateMappingTable, SalesforceObjectDefinitionIncompleteError } from '../../src/logic/mapping-generation-service';
import * as authService from '../../src/logic/authentication-authorization';
import * as contextResolver from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-047: SalesforceObjectDefinitionIncompleteError when object structure is null', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SalesforceObjectDefinitionIncompleteError when Salesforce object definition is incomplete', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '770e8400-e29b-41d4-a716-446655440002';
    const executionTimestamp = 1704067200000;

    (authService.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      hasPermission: true,
    });

    (contextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectExists: true,
      targetSystemExists: true,
      userHasAccess: true,
    });

    await expect(
      generateMappingTable({
        projectId,
        targetSystemId,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow(SalesforceObjectDefinitionIncompleteError);

    await expect(
      generateMappingTable({
        projectId,
        targetSystemId,
        userId,
        executionTimestamp,
      })
    ).rejects.toThrow('Salesforceオブジェクト定義が不完全です。請求書・請求明細の構造定義を確認してください。');
  });
});
