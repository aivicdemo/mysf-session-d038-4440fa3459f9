import { deleteMappingDetails, DataStoreError } from '../../src/logic/mapping-persistence';
import * as projectResolver from '../../src/logic/project-context-resolver';
import * as authAuth from '../../src/logic/authentication-authorization';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/platform/data-store');

describe('SCEN-222: deleteMappingDetails - DataStoreError', () => {
  const mappingDetailId = '550e8400-e29b-41d4-a716-446655440000';
  const projectId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const operationTimestamp = '2026-10-07T10:30:00Z';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when data store access fails', async () => {
    (authAuth.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId
    });

    (projectResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      isContextValid: true
    });

    (dataStore.listRecords as jest.Mock).mockRejectedValue(
      new DataStoreError('データベース操作に失敗しました。管理者に連絡してください。')
    );

    await expect(
      deleteMappingDetails({
        mappingDetailId,
        projectId,
        userId,
        operationTimestamp
      })
    ).rejects.toThrow(DataStoreError);

    await expect(
      deleteMappingDetails({
        mappingDetailId,
        projectId,
        userId,
        operationTimestamp
      })
    ).rejects.toThrow('データベース操作に失敗しました。管理者に連絡してください。');

    expect(dataStore.deleteRecord).not.toHaveBeenCalled();
  });
});
