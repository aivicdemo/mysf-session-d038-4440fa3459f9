import { retrieveMappingValidationResultsForProject, DataStoreError } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));
jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-211: マッピング検証結果テーブルへのアクセスに失敗したとき、DataStoreErrorが発生する', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const mockProjectContext = {
    projectId,
    userId: 'user-uuid-001',
    hasAccess: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when accessing マッピング検証結果 table fails', async () => {
    // Mock resolveProjectContext to return valid project context
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(
      mockProjectContext
    );

    // Mock data store to throw DataStoreError when listRecords is called
    (dataStore.listRecords as jest.Mock).mockRejectedValue(
      new DataStoreError('マッピング検証結果の取得に失敗しました。')
    );

    // Call the function and expect it to reject with DataStoreError
    const error = await retrieveMappingValidationResultsForProject({ projectId }).catch(e => e);

    expect(error).toBeInstanceOf(DataStoreError);
    expect(error.message).toBe('マッピング検証結果の取得に失敗しました。');

    // Verify that resolveProjectContext was called
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();

    // Verify that listRecords was called
    expect(dataStore.listRecords).toHaveBeenCalled();
  });
});
