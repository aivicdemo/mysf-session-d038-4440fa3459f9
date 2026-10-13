import { saveMappingDetails, ProjectContextNotFoundError } from '../../src/logic/mapping-persistence';
import * as authAuthModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-144: saveMappingDetails - プロジェクトコンテキスト未検出時にProjectContextNotFoundErrorが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectContextNotFoundError when project context is not found', async () => {
    const projectId = '00000000-0000-0000-0000-000000000001';
    const targetSystemId = '00000000-0000-0000-0000-000000000002';
    const userId = '00000000-0000-0000-0000-000000000004';
    const operationTimestamp = '2026-01-15T10:30:00Z';

    const input = {
      projectId,
      targetSystemId,
      existingFunctionName: '請求書作成',
      mappingTargetObjectId: '00000000-0000-0000-0000-000000000003',
      mappingMethod: '標準機能利用',
      userId,
      operationTimestamp,
    };

    // Mock successful authentication
    (authAuthModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId,
    });

    // Mock project context not found
    (projectContextModule.resolveProjectContext as jest.Mock).mockRejectedValue(
      new ProjectContextNotFoundError('プロジェクトコンテキストが見つかりません。')
    );

    await expect(saveMappingDetails(input)).rejects.toThrow(ProjectContextNotFoundError);
    await expect(saveMappingDetails(input)).rejects.toThrow('プロジェクトコンテキストが見つかりません。');
  });
});
