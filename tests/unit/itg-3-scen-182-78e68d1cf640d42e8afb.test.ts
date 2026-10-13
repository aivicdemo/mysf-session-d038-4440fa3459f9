import { updateDiscrepancyToleranceJudgment } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-182: 判定者ユーザーIDが指定された場合、更新後のレコードの判定者フィールドにそのユーザーIDが格納される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ユーザーIDが正しく格納される', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');

    const existingRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'LEGACY-INV-2026-001',
      newSystemInvoiceId: 'NEW-INV-2026-001',
      discrepancyType: 'amount_difference',
      discrepancyContent: '請求金額が異なります',
      amountDifference: 5000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2026-01-14T10:00:00Z',
      severity: 'high',
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
      createdAt: '2026-01-14T10:00:00Z',
      updatedAt: '2026-01-14T10:00:00Z',
    };

    mockDataStore.listRecords.mockResolvedValue([existingRecord]);
    mockDataStore.updateRecord.mockResolvedValue({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'LEGACY-INV-2026-001',
      newSystemInvoiceId: 'NEW-INV-2026-001',
      discrepancyType: 'amount_difference',
      discrepancyContent: '請求金額が異なります',
      amountDifference: 5000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2026-01-14T10:00:00Z',
      severity: 'high',
      causeClassification: null,
      toleranceJudgment: 'within_tolerance',
      toleranceJudgmentDateTime: '2026-01-15T14:30:00Z',
      judgedByUserId: 'user-uuid-12345678-1234-1234-1234-123456789abc',
    });

    const result = await updateDiscrepancyToleranceJudgment({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      toleranceJudgment: 'within_tolerance',
      toleranceJudgmentDateTime: '2026-01-15T14:30:00Z',
      judgedByUserId: 'user-uuid-12345678-1234-1234-1234-123456789abc',
    });

    expect(result.judgedByUserId).toBe('user-uuid-12345678-1234-1234-1234-123456789abc');
    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.legacySystemInvoiceId).toBe('LEGACY-INV-2026-001');
    expect(result.newSystemInvoiceId).toBe('NEW-INV-2026-001');
    expect(result.discrepancyType).toBe('amount_difference');
    expect(result.discrepancyContent).toBe('請求金額が異なります');
    expect(result.amountDifference).toBe(5000);
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.detectionDateTime).toBe('2026-01-14T10:00:00Z');
    expect(result.severity).toBe('high');
    expect(result.causeClassification).toBeNull();
    expect(result.toleranceJudgment).toBe('within_tolerance');
    expect(result.toleranceJudgmentDateTime).toBe('2026-01-15T14:30:00Z');
  });
});
