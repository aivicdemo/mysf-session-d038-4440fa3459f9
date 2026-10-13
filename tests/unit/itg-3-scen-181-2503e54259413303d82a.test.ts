import { updateDiscrepancyToleranceJudgment } from '../../src/logic/discrepancy-persistence';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-181: 判定日時としてISO 8601形式の文字列が指定された場合、更新後のレコードの判定日時フィールドにその値が格納される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ISO 8601形式の判定日時がそのまま格納される', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');

    const existingRecord = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'INV-2026-00001',
      newSystemInvoiceId: 'NEW-INV-2026-00001',
      discrepancyType: 'amount',
      discrepancyContent: '請求金額の差異が検出されました',
      amountDifference: 1500,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2026-01-15T10:00:00.000Z',
      severity: 'medium',
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
    };

    mockDataStore.listRecords.mockResolvedValue([existingRecord]);
    mockDataStore.updateRecord.mockResolvedValue({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'INV-2026-00001',
      newSystemInvoiceId: 'NEW-INV-2026-00001',
      discrepancyType: 'amount',
      discrepancyContent: '請求金額の差異が検出されました',
      amountDifference: 1500,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2026-01-15T10:00:00.000Z',
      severity: 'medium',
      causeClassification: null,
      toleranceJudgment: 'within_tolerance',
      toleranceJudgmentDateTime: '2026-01-15T14:30:45.123Z',
      judgedByUserId: 'user-judge-001',
    });

    const result = await updateDiscrepancyToleranceJudgment({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      toleranceJudgment: 'within_tolerance',
      toleranceJudgmentDateTime: '2026-01-15T14:30:45.123Z',
      judgedByUserId: 'user-judge-001',
    });

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.legacySystemInvoiceId).toBe('INV-2026-00001');
    expect(result.newSystemInvoiceId).toBe('NEW-INV-2026-00001');
    expect(result.discrepancyType).toBe('amount');
    expect(result.discrepancyContent).toBe('請求金額の差異が検出されました');
    expect(result.amountDifference).toBe(1500);
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.detectionDateTime).toBe('2026-01-15T10:00:00.000Z');
    expect(result.severity).toBe('medium');
    expect(result.causeClassification).toBeNull();
    expect(result.toleranceJudgment).toBe('within_tolerance');
    expect(result.toleranceJudgmentDateTime).toBe('2026-01-15T14:30:45.123Z');
    expect(result.judgedByUserId).toBe('user-judge-001');
  });
});
