import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';
import type { ValidateDataIntegrityForMonthlyCloseInput } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-075: 検証実行日時が正確に出力に含まれ、入力時刻と一致する', () => {
  it('検証実行日時が入力の executionTimestamp と完全に一致する', async () => {
    // Preconditions setup
    const executionTimestamp = new Date('2024-01-15T14:30:45.123Z');

    const dealRecords = [
      {
        dealId: 'DEAL-001',
        accountId: 'ACC-001',
        dealStatus: 'closed_won',
        dealAmount: 100000,
        invoiceIds: ['INV-001'],
      },
    ];

    const invoiceRecords = [
      {
        invoiceId: 'INV-001',
        accountId: 'ACC-001',
        dealId: 'DEAL-001',
        invoiceStatus: 'paid',
        invoiceAmount: 100000,
      },
    ];

    const statusCorrespondenceRules = [
      {
        dealStatus: 'closed_won',
        allowedInvoiceStatuses: ['invoiced', 'paid'],
      },
    ];

    const amountToleranceCriteria = {
      tolerancePercentage: 5,
      toleranceAbsoluteAmount: 1000,
    };

    const input: ValidateDataIntegrityForMonthlyCloseInput = {
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    };

    // Execute
    const output = await validateDataIntegrityForMonthlyClose(input);

    // Expected result verification
    // executionTimestamp フィールドが入力の executionTimestamp 値と完全に一致する
    expect(output.executionTimestamp).toEqual(executionTimestamp);

    // 検証結果が PASSED となる
    expect(output.validationResult).toBe('PASSED');

    // 検証件数が正確に記録される
    expect(output.totalDealsValidated).toBe(1);
    expect(output.totalInvoicesValidated).toBe(1);

    // 違反情報が空配列となる
    expect(output.referentialIntegrityViolations).toEqual([]);
    expect(output.statusCorrespondenceViolations).toEqual([]);
    expect(output.amountDiscrepancies).toEqual([]);
    expect(output.abnormalCasesList).toEqual([]);
  });
});
