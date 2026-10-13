import { deleteMigrationRiskAssessment, RecordNotFoundError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-228: deleteMigrationRiskAssessment - RecordNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw RecordNotFoundError when risk assessment record does not exist', async () => {
    const riskAssessmentId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = 'user-001';
    const operationTimestamp = '2026-01-15T10:30:00Z';

    // Mock data store to return empty array (no risk assessment found)
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    // Call the function and expect it to throw RecordNotFoundError
    await expect(
      deleteMigrationRiskAssessment({
        riskAssessmentId,
        projectId,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(new RecordNotFoundError('指定されたIDの移行リスク評価レコードが見つかりません。'));
  });
});
