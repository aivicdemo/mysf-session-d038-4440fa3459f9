import { generateMappingTable, UserNotAuthenticatedError } from '../../src/logic/mapping-generation-service';
import * as authModule from '../../src/logic/authentication-authorization';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));

describe('SCEN-033: UserNotAuthenticatedError', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const executionTimestamp = 1704067200000;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserNotAuthenticatedError when user is not authenticated or session is invalid', async () => {
    const mockAuthError = new UserNotAuthenticatedError(
      'ユーザーが認証されていません。ログインしてください。'
    );

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockRejectedValue(
      mockAuthError
    );

    const input = {
      projectId,
      targetSystemId,
      userId,
      executionTimestamp,
    };

    await expect(generateMappingTable(input)).rejects.toThrow(UserNotAuthenticatedError);
    await expect(generateMappingTable(input)).rejects.toThrow(
      'ユーザーが認証されていません。ログインしてください。'
    );
  });
});
