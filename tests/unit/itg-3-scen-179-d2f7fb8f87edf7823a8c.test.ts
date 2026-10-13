import { updateDiscrepancyToleranceJudgment } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-179: when within_tolerance is specified, the updated record should contain within_tolerance', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update tolerance judgment to within_tolerance and return updated record', async () => {
    const discrepancyId = 'd550e8c4-a291-4a74-9fbc-eab3ff4a75e0';
    const toleranceJudgment = 'within_tolerance';
    const toleranceJudgmentDateTime = '2024-12-01T15:45:30Z';
    const judgedByUserId = 'usr-judge-001';

    // Setup data store mock: listRecords returns existing discrepancy record
    const existingRecord = {
      id: discrepancyId,
      差異ID: discrepancyId,
      旧システム請求書ID: 'INV-2024-00001',
      新システム請求書ID: 'NEW-INV-2024-00001',
      差異種類: '金額差異',
      差異内容: '請求金額が異なる',
      金額差異: 5000,
      件数差異: null,
      ステータス差異: null,
      検出日時: '2024-12-01T10:30:00Z',
      重大度: 'high',
      原因分類: null,
      許容範囲判定: null,
      判定日時: null,
      判定者: null,
    };

    const updatedRecord = {
      ...existingRecord,
      許容範囲判定: 'within_tolerance',
      判定日時: toleranceJudgmentDateTime,
      判定者: judgedByUserId,
      updatedAt: toleranceJudgmentDateTime,
    };

    mockDataStore.listRecords.mockResolvedValue([existingRecord]);
    mockDataStore.updateRecord.mockResolvedValue(updatedRecord);

    // Call the function
    const result = await updateDiscrepancyToleranceJudgment({
      discrepancyId,
      toleranceJudgment,
      toleranceJudgmentDateTime,
      judgedByUserId,
    });

    // Verify the result matches expected output
    expect(result.discrepancyId).toBe(discrepancyId);
    expect(result.legacySystemInvoiceId).toBe('INV-2024-00001');
    expect(result.newSystemInvoiceId).toBe('NEW-INV-2024-00001');
    expect(result.discrepancyType).toBe('金額差異');
    expect(result.discrepancyContent).toBe('請求金額が異なる');
    expect(result.amountDifference).toBe(5000);
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.detectionDateTime).toBe('2024-12-01T10:30:00Z');
    expect(result.severity).toBe('high');
    expect(result.causeClassification).toBeNull();
    expect(result.toleranceJudgment).toBe('within_tolerance');
    expect(result.toleranceJudgmentDateTime).toBe('2024-12-01T15:45:30Z');
    expect(result.judgedByUserId).toBe('usr-judge-001');
  });
});
