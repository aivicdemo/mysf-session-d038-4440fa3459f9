import { validateDataIntegrityForMonthlyClose, InvalidInputData } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-062: 取引先・商談・請求データに負数金額が含まれるとき、金額検証エラーが発生する', () => {
  it('負数金額を含むデータで金額検証エラーが発生する', async () => {
    const input = {
      dealRecords: [
        {
          dealId: 'DEAL001',
          accountId: 'ACC001',
          dealStatus: 'closed_won',
          dealAmount: -50000,
          invoiceIds: ['INV001'],
        },
      ],
      invoiceRecords: [
        {
          invoiceId: 'INV001',
          accountId: 'ACC001',
          dealId: 'DEAL001',
          invoiceStatus: 'invoiced',
          invoiceAmount: 50000,
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
      executionTimestamp: new Date('2026-10-07T06:33:50.000Z'),
    };

    await expect(validateDataIntegrityForMonthlyClose(input)).rejects.toThrow(
      InvalidInputData
    );
  });
});
