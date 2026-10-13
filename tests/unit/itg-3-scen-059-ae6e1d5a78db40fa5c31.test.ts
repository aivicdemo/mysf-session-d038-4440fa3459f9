import { validateDataIntegrityForMonthlyClose, InvalidInputData } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-059: 取引先IDリストが空のとき、参照チェーン検証エラーが発生する', () => {
  it('should throw InvalidInputData error when dealRecords is empty', async () => {
    const input = {
      dealRecords: [],
      invoiceRecords: [
        {
          invoiceId: 'INV-001',
          accountId: 'ACC-001',
          dealId: 'DEAL-001',
          invoiceStatus: 'draft',
          invoiceAmount: 100000,
        },
      ],
      statusCorrespondenceRules: [
        {
          dealStatus: 'closed_won',
          allowedInvoiceStatuses: ['invoiced', 'paid'],
        },
      ],
      amountToleranceCriteria: {
        tolerancePercentage: 5,
        toleranceAbsoluteAmount: 1000,
      },
      executionTimestamp: new Date('2026-01-15T10:00:00Z'),
    };

    await expect(validateDataIntegrityForMonthlyClose(input)).rejects.toThrow(InvalidInputData);
    await expect(validateDataIntegrityForMonthlyClose(input)).rejects.toThrow('入力データ検証エラー: 入力形式が不正です。');
  });
});
