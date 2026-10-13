import { deleteMappingDetails, UserAuthenticationFailedError } from '../../src/logic/mapping-persistence';
import * as projectResolver from '../../src/logic/project-context-resolver';
import * as authAuth from '../../src/logic/authentication-authorization';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/platform/data-store');

describe('SCEN-220: deleteMappingDetails - UserAuthenticationFailedError', () => {
  const mappingDetailId = '550e8400-e29b-41d4-a716-446655440000';
  const projectId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = '550e8400-e29b-41d4-a716-446655440002';
  const operationTimestamp = '2026-10-07T10:30:00.000Z';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UserAuthenticationFailedError when user is not authenticated', async () => {
    (authAuth.verifyUserAuthenticationAndAuthorization as jest.Mock).mockRejectedValue(
      new UserAuthenticationFailedError('ユーザー認証に失敗しました。再度ログインしてください。')
    );

    await expect(
      deleteMappingDetails({
        mappingDetailId,
        projectId,
        userId,
        operationTimestamp
      })
    ).rejects.toThrow(UserAuthenticationFailedError);

    await expect(
      deleteMappingDetails({
        mappingDetailId,
        projectId,
        userId,
        operationTimestamp
      })
    ).rejects.toThrow('ユーザー認証に失敗しました。再度ログインしてください。');
  });
});
