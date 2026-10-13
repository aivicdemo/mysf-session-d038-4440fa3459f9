import { saveMappingDetails, AuthenticationFailedError } from '../../src/logic/mapping-persistence';
import * as authAuthModule from '../../src/logic/authentication-authorization';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-142: saveMappingDetails - ユーザーが認証されていない場合、AuthenticationFailedErrorが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AuthenticationFailedError when user is not authenticated', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '550e8400-e29b-41d4-a716-446655440001';
    const userId = '550e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2026-10-07T06:31:40.000Z';

    const input = {
      projectId,
      targetSystemId,
      existingFunctionName: '請求書作成機能',
      mappingTargetObjectId: '550e8400-e29b-41d4-a716-446655440002',
      mappingMethod: '標準機能利用',
      userId,
      operationTimestamp,
    };

    // Mock authentication failure
    (authAuthModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockRejectedValue(
      new AuthenticationFailedError('ユーザー認証に失敗しました。再度ログインしてください。')
    );

    await expect(saveMappingDetails(input)).rejects.toThrow(AuthenticationFailedError);
    await expect(saveMappingDetails(input)).rejects.toThrow('ユーザー認証に失敗しました。再度ログインしてください。');
  });
});
