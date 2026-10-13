import { retrieveMigrationRiskAssessmentsForProject, ProjectNotFoundError } from '../../src/logic/mapping-persistence';
import * as projectResolver from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-214: retrieveMigrationRiskAssessmentsForProject - ProjectNotFoundError', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectNotFoundError when resolveProjectContext returns null', async () => {
    (projectResolver.resolveProjectContext as jest.Mock).mockResolvedValue(null);

    await expect(
      retrieveMigrationRiskAssessmentsForProject({ projectId })
    ).rejects.toThrow(ProjectNotFoundError);

    await expect(
      retrieveMigrationRiskAssessmentsForProject({ projectId })
    ).rejects.toThrow('指定されたプロジェクトが見つかりません。');
  });
});
