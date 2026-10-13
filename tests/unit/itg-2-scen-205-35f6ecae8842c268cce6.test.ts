import { retrieveMappingDetailsForProject, ProjectNotFoundError } from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';

jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-205: 指定したプロジェクトIDが存在しない場合', () => {
  const mockProjectContext = projectContextResolver as jest.Mocked<typeof projectContextResolver>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ProjectNotFoundErrorが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';

    mockProjectContext.resolveProjectContext.mockResolvedValue(null);

    await expect(
      retrieveMappingDetailsForProject({ projectId }),
    ).rejects.toThrow(ProjectNotFoundError);
  });
});
