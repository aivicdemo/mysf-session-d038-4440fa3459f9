import { updateDiscrepancyToleranceJudgment } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-180: when exceeds_tolerance is specified, the updated record should contain exceeds_tolerance', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update tolerance judgment to exceeds_tolerance and return updated record', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
    const toleranceJudgment = 'exceeds_tolerance';
    const toleranceJudgmentDateTime = '2025-01-15T10:30:00Z';
    const judgedByUserId = 'user-judge-001';

    // Setup data store mock: listRecords returns existing discrepancy record
    const existingRecord = {
      id: discrepancyId,
      差異ID: discrepancyId,
      旧システム請求書ID: 'INV-2025-00001',
      新システム請求書ID: 'NEWINV-2025-00001',
      差異種類: 'amount',
      差異内容: '請求金額が一致しない',
      金額差異: 5000,
      件数差異: null,
      ステータス差異: null,
      検出日時: '2025-01-14T09:00:00Z',
      重大度: 'high',
      原因分類: null,
      許容範囲判定: null,
      判定日時: null,
      判定者: null,
    };

    const updatedRecord = {
      ...existingRecord,
      許容範囲判定: 'exceeds_tolerance',
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
    expect(result.legacySystemInvoiceId).toBe('INV-2025-00001');
    expect(result.newSystemInvoiceId).toBe('NEWINV-2025-00001');
    expect(result.discrepancyType).toBe('amount');
    expect(result.discrepancyContent).toBe('請求金額が一致しない');
    expect(result.amountDifference).toBe(5000);
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.detectionDateTime).toBe('2025-01-14T09:00:00Z');
    expect(result.severity).toBe('high');
    expect(result.causeClassification).toBeNull();
    expect(result.toleranceJudgment).toBe('exceeds_tolerance');
    expect(result.toleranceJudgmentDateTime).toBe('2025-01-15T10:30:00Z');
    expect(result.judgedByUserId).toBe('user-judge-001');
  });
});
