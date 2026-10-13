import {
  retrieveMigrationRiskAssessmentsForProject,
  MigrationRiskAssessmentRecord,
} from '../../src/logic/mapping-persistence';
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

describe('SCEN-213: 指定されたプロジェクトIDに属する移行リスク評価レコードが1件も存在しない場合、空の配列を返す', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const mockProjectContext = {
    projectId,
    projectName: 'Salesforce移行プロジェクトA',
    status: 'active',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty array when no migration risk assessment records exist for the specified projectId', async () => {
    // Mock resolveProjectContext to return valid project context
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(
      mockProjectContext
    );

    // Mock data store to return empty array
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    // Call the function
    const result = await retrieveMigrationRiskAssessmentsForProject({ projectId });

    // Verify that the result is an empty array
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);

    // Verify that resolveProjectContext was called
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();

    // Verify that listRecords was called
    expect(dataStore.listRecords).toHaveBeenCalled();
  });
});
