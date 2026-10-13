import { generateMappingTable, UserUnauthorizedError } from '../../src/logic/mapping-generation-service';
import * as authModule from '../../src/logic/authentication-authorization';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/mapping-persistence');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/logic/audit-trail-service');

describe('SCEN-034: generateMappingTable - User Unauthorized Error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserUnauthorizedError when user is authenticated but lacks MAPPING_GENERATION permission', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '770e8400-e29b-41d4-a716-446655440002';
    const executionTimestamp = 1704067200000;

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: false,
      userId,
      operationType: 'MAPPING_GENERATION',
      projectId,
      denialReason: 'この操作を実行する権限がありません。',
    });

    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    try {
      await generateMappingTable(input);
      fail('Expected UserUnauthorizedError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UserUnauthorizedError);
      expect((error as Error).message).toBe('この操作を実行する権限がありません。');
    }
  });
});
