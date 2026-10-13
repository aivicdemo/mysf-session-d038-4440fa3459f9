import { deleteMappingDetails, ProjectContextInvalidError } from '../../src/logic/mapping-persistence';
import * as projectResolver from '../../src/logic/project-context-resolver';
import * as authAuth from '../../src/logic/authentication-authorization';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/platform/data-store');

describe('SCEN-218: deleteMappingDetails - ProjectContextInvalidError', () => {
  const mappingDetailId = '660e8400-e29b-41d4-a716-446655440001';
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const operationTimestamp = '2026-10-07T10:30:00Z';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectContextInvalidError when project context is invalid', async () => {
    (projectResolver.resolveProjectContext as jest.Mock).mockResolvedValue(null);

    await expect(
      deleteMappingDetails({
        mappingDetailId,
        projectId,
        userId,
        operationTimestamp
      })
    ).rejects.toThrow(ProjectContextInvalidError);

    await expect(
      deleteMappingDetails({
        mappingDetailId,
        projectId,
        userId,
        operationTimestamp
      })
    ).rejects.toThrow(`プロジェクトコンテキストが無効です。プロジェクトID: ${projectId}`);

    expect(authAuth.verifyUserAuthenticationAndAuthorization).not.toHaveBeenCalled();
    expect(dataStore.deleteRecord).not.toHaveBeenCalled();
  });
});
