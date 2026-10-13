import { analyzeReferenceRelationships, ProjectNotFound } from '../../src/logic/reference-relationship-analyzer';
import type { AnalyzeReferenceRelationshipsInput } from '../../src/logic/reference-relationship-analyzer';
import * as mappingPersistence from '../../src/logic/mapping-persistence';

jest.mock('../../src/logic/mapping-persistence');

describe('SCEN-117: analyzeReferenceRelationships - ProjectNotFoundエラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定されたプロジェクトIDが存在しないまたはユーザーがアクセス権を持たない場合、ProjectNotFoundエラーを返す', async () => {
    const projectId = 'proj-nonexistent-12345';
    const targetSystemId = 'target-oracle-001';
    const executedAt = new Date('2026-10-07T10:30:00.000Z');
    const executedByUserId = 'user-001';

    // Mock retrieveMappingDetailsForProject to return empty array (project not found)
    (mappingPersistence.retrieveMappingDetailsForProject as jest.Mock).mockResolvedValueOnce({
      customObjectDefinitions: [],
      objectReferences: [],
      calculationLogicDefinitions: [],
    });

    const input: AnalyzeReferenceRelationshipsInput = {
      projectId,
      targetSystemId,
      includeCalculationLogicDependencies: true,
      executedAt,
      executedByUserId,
    };

    // Verify that ProjectNotFound error is thrown
    await expect(analyzeReferenceRelationships(input)).rejects.toThrow(ProjectNotFound);

    // Verify retrieveMappingDetailsForProject was called
    expect(mappingPersistence.retrieveMappingDetailsForProject).toHaveBeenCalledWith(projectId);
  });
});
