import { retrieveDiscrepancyDetailsForConfirmation, NewInvoiceNotFoundError } from '../../src/logic/discrepancy-persistence';
import type { RetrieveDiscrepancyDetailsForConfirmationInput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-210: 差異検出結果に紐づく新システム請求書IDが新システム請求書テーブルに存在しない場合、NewInvoiceNotFoundErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新システム請求書が見つからない場合、NewInvoiceNotFoundErrorを発生させる', async () => {
    const discrepancyRecord = {
      id: 'diff-uuid-001',
      discrepancyId: 'diff-uuid-001',
      legacySystemInvoiceId: 'legacy-inv-001',
      newSystemInvoiceId: 'new-inv-notfound',
      discrepancyType: '金額差異',
      discrepancyContent: '請求金額が異なる',
      amountDifference: 5000,
      countDifference: 0,
      statusDifference: null,
      detectionDateTime: '2026-01-15T10:30:00Z',
      severity: '高',
      causeClassification: 'システム移行エラー',
      toleranceJudgment: '範囲外',
      toleranceJudgmentDateTime: '2026-01-15T11:00:00Z',
      judgedByUserId: 'user-uuid-001',
      createdAt: '2026-01-15T10:30:00Z',
      updatedAt: '2026-01-15T11:00:00Z',
    };

    const legacyInvoiceRecord = {
      id: 'legacy-inv-001',
      invoiceId: 'legacy-inv-001',
      invoiceNumber: 'INV-2026-0001',
      invoiceDate: '2026-01-10T00:00:00Z',
      invoiceAmount: 100000,
      taxAmount: 10000,
      status: '確定',
      paymentDueDate: '2026-02-10T00:00:00Z',
      remarks: '2026年1月売上',
    };

    (dataStore.listRecords as jest.Mock)
      .mockResolvedValueOnce([discrepancyRecord])
      .mockResolvedValueOnce([legacyInvoiceRecord])
      .mockResolvedValueOnce([]);

    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId: 'diff-uuid-001',
    };

    await expect(retrieveDiscrepancyDetailsForConfirmation(input)).rejects.toThrow(NewInvoiceNotFoundError);
    await expect(retrieveDiscrepancyDetailsForConfirmation(input)).rejects.toThrow('新システム請求書データが見つかりません。');
  });
});
