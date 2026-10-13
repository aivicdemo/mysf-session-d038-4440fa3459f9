import { retrieveDiscrepancyDetailsForConfirmation, LegacyInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';
import type { RetrieveDiscrepancyDetailsForConfirmationInput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-209: 差異検出結果に紐づく旧システム請求書IDが旧システム請求書テーブルに存在しない場合、LegacyInvoiceNotFoundErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('旧システム請求書が見つからない場合、LegacyInvoiceNotFoundErrorを発生させる', async () => {
    const discrepancyRecord = {
      id: 'diff-001',
      discrepancyId: 'diff-001',
      legacySystemInvoiceId: 'legacy-inv-999',
      newSystemInvoiceId: 'new-inv-001',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額の不一致',
      amountDifference: 50000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2026-01-15T10:30:00Z',
      severity: 'HIGH',
      causeClassification: 'システムエラー',
      toleranceJudgment: 'OUT_OF_RANGE',
      toleranceJudgmentDateTime: '2026-01-15T11:00:00Z',
      judgedByUserId: 'user-001',
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T11:00:00Z',
    };

    const newInvoiceRecord = {
      id: 'new-inv-001',
      invoiceId: 'new-inv-001',
      invoiceNumber: 'INV-2026-0001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 1000000,
      taxAmount: 100000,
      status: 'issued',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: 'システムテスト用請求書',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([newInvoiceRecord]);

    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId: 'diff-001',
    };

    await expect(retrieveDiscrepancyDetailsForConfirmation(input)).rejects.toThrow(LegacyInvoiceNotFoundError);
    await expect(retrieveDiscrepancyDetailsForConfirmation(input)).rejects.toThrow('旧システム請求書データが見つかりません。');
  });
});
