import { updateDiscrepancyToleranceJudgment } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-183: 更新後のレコードには、更新前に保存されていた旧システム請求書ID・新システム請求書ID・差異種類・差異内容・金額差異・件数差異・ステータス差異・検出日時・重大度・原因分類が保持されている', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('更新前の値が保持される', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');

    const existingRecord = {
      discrepancyId: 'disc-001',
      legacySystemInvoiceId: 'INV-2024-001',
      newSystemInvoiceId: 'NEW-INV-2024-001',
      discrepancyType: 'amount',
      discrepancyContent: '請求金額の不一致',
      amountDifference: 5000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2024-01-15T10:30:00Z',
      severity: 'high',
      causeClassification: 'calculation_error',
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
    };

    mockDataStore.listRecords.mockResolvedValue([existingRecord]);
    mockDataStore.updateRecord.mockResolvedValue({
      discrepancyId: 'disc-001',
      legacySystemInvoiceId: 'INV-2024-001',
      newSystemInvoiceId: 'NEW-INV-2024-001',
      discrepancyType: 'amount',
      discrepancyContent: '請求金額の不一致',
      amountDifference: 5000,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2024-01-15T10:30:00Z',
      severity: 'high',
      causeClassification: 'calculation_error',
      toleranceJudgment: 'exceeds_tolerance',
      toleranceJudgmentDateTime: '2024-01-16T14:45:00Z',
      judgedByUserId: 'user-judge-001',
    });

    const result = await updateDiscrepancyToleranceJudgment({
      discrepancyId: 'disc-001',
      toleranceJudgment: 'exceeds_tolerance',
      toleranceJudgmentDateTime: '2024-01-16T14:45:00Z',
      judgedByUserId: 'user-judge-001',
    });

    expect(result.discrepancyId).toBe('disc-001');
    expect(result.legacySystemInvoiceId).toBe('INV-2024-001');
    expect(result.newSystemInvoiceId).toBe('NEW-INV-2024-001');
    expect(result.discrepancyType).toBe('amount');
    expect(result.discrepancyContent).toBe('請求金額の不一致');
    expect(result.amountDifference).toBe(5000);
    expect(result.countDifference).toBeNull();
    expect(result.statusDifference).toBeNull();
    expect(result.detectionDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.severity).toBe('high');
    expect(result.causeClassification).toBe('calculation_error');
    expect(result.toleranceJudgment).toBe('exceeds_tolerance');
    expect(result.toleranceJudgmentDateTime).toBe('2024-01-16T14:45:00Z');
    expect(result.judgedByUserId).toBe('user-judge-001');
  });
});
