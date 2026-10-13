import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-067: 商談レコードが空で商談ステータス対応検証が実行されないとき', () => {
  it('検証対象なし警告が発生する', async () => {
    const dealRecords: any[] = [];
    const invoiceRecords = [
      {
        invoiceId: 'INV001',
        accountId: 'ACC001',
        dealId: 'DEAL001',
        invoiceStatus: 'ISSUED',
        invoiceAmount: 100000,
      },
    ];
    const statusCorrespondenceRules = [
      {
        dealStatus: 'CLOSED_WON',
        allowedInvoiceStatuses: ['ISSUED', 'PAID'],
      },
    ];
    const amountToleranceCriteria = {
      tolerancePercentage: 5,
      toleranceAbsoluteAmount: 10000,
    };
    const executionTimestamp = new Date('2024-01-31T23:59:59Z');

    const result = await validateDataIntegrityForMonthlyClose({
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    });

    expect(result.validationResult).toBe('FAILED_WITH_WARNINGS');
    expect(result.statusCorrespondenceViolations).toEqual([]);
    expect(result.abnormalCasesList).toEqual([]);
    expect(result.totalDealsValidated).toBe(0);
    expect(result.totalInvoicesValidated).toBe(1);
    expect(result.referentialIntegrityViolations).toEqual([]);
    expect(result.amountDiscrepancies).toEqual([]);
  });
});
