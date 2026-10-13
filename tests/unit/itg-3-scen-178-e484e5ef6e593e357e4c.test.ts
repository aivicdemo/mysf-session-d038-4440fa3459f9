import { updateDiscrepancyToleranceJudgment, DataStoreUpdateError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-178: DataStoreUpdateError is raised when update to discrepancy detection result table fails', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should raise DataStoreUpdateError when data store update fails', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
    const toleranceJudgment = 'within_tolerance';
    const toleranceJudgmentDateTime = '2025-01-15T10:30:00Z';
    const judgedByUserId = 'user-judge-001';

    // Setup data store mock: listRecords returns existing discrepancy record
    const existingRecord = {
      id: discrepancyId,
      差異ID: discrepancyId,
      旧システム請求書ID: 'LEGACY-INV-20250101-001',
      新システム請求書ID: 'NEW-INV-20250101-001',
      差異種類: 'amount',
      差異内容: '請求金額が100円異なる',
      金額差異: 100,
      件数差異: null,
      ステータス差異: null,
      検出日時: '2025-01-14T09:00:00Z',
      重大度: 'low',
      原因分類: null,
      許容範囲判定: null,
      判定日時: null,
      判定者: null,
      createdAt: '2025-01-14T09:00:00Z',
      updatedAt: '2025-01-14T09:00:00Z',
    };

    mockDataStore.listRecords.mockResolvedValue([existingRecord]);
    mockDataStore.updateRecord.mockRejectedValue(new Error('Database update failed'));

    // Call the function and expect DataStoreUpdateError
    await expect(
      updateDiscrepancyToleranceJudgment({
        discrepancyId,
        toleranceJudgment,
        toleranceJudgmentDateTime,
        judgedByUserId,
      })
    ).rejects.toThrow(DataStoreUpdateError);
  });
});
