import { retrieveMappingValidationResultsForProject, ProjectNotFoundError } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-210: 指定されたプロジェクトIDが存在しないか、ユーザーがアクセス権を持たないとき、ProjectNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ProjectNotFoundError が発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';

    // resolveProjectContext をモック：null を返す（プロジェクトが存在しないか、アクセス権がない）
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(null);

    // データストアをモック
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    // 処理を実行し、ProjectNotFoundError が発生することを検証
    await expect(retrieveMappingValidationResultsForProject({ projectId })).rejects.toThrow(ProjectNotFoundError);
    await expect(retrieveMappingValidationResultsForProject({ projectId })).rejects.toThrow('指定されたプロジェクトが見つかりません。');
  });
});
