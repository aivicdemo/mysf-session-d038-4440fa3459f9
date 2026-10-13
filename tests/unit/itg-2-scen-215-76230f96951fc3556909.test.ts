import { retrieveMigrationRiskAssessmentsForProject, DataStoreError } from '../../src/logic/mapping-persistence';
import * as projectResolver from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-215: retrieveMigrationRiskAssessmentsForProject - DataStoreError', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const validProjectContext = {
    projectId: '550e8400-e29b-41d4-a716-446655440000',
    projectName: 'Salesforce移行プロジェクトA',
    status: 'active'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when data store access fails', async () => {
    (projectResolver.resolveProjectContext as jest.Mock).mockResolvedValue(validProjectContext);
    (dataStore.listRecords as jest.Mock).mockRejectedValue(
      new DataStoreError('移行リスク評価データの取得に失敗しました。')
    );

    await expect(
      retrieveMigrationRiskAssessmentsForProject({ projectId })
    ).rejects.toThrow(DataStoreError);

    await expect(
      retrieveMigrationRiskAssessmentsForProject({ projectId })
    ).rejects.toThrow('移行リスク評価データの取得に失敗しました。');
  });
});
