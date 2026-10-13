import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';
import type { ValidateDataIntegrityForMonthlyCloseInput } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-074: 商談と請求書の取引先IDが不一致のとき', () => {
  it('参照チェーン違反として検出される', async () => {
    const dealRecords = [
      {
        dealId: 'DEAL-001',
        accountId: 'ACC-A',
        dealStatus: 'closed_won',
        dealAmount: 100000,
        invoiceIds: ['INV-001'],
      },
    ];

    const invoiceRecords = [
      {
        invoiceId: 'INV-001',
        accountId: 'ACC-B',
        dealId: 'DEAL-001',
        invoiceStatus: 'invoiced',
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

    const executionTimestamp = new Date('2025-01-15T10:00:00Z');

    const input: ValidateDataIntegrityForMonthlyCloseInput = {
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    };

    const result = await validateDataIntegrityForMonthlyClose(input);

    expect(result.validationResult).toBe('FAILED_WITH_VIOLATIONS');
    expect(result.totalDealsValidated).toBe(1);
    expect(result.totalInvoicesValidated).toBe(1);

    expect(result.referentialIntegrityViolations).toHaveLength(1);
    const violation = result.referentialIntegrityViolations[0];
    expect(violation.dealId).toBe('DEAL-001');
    expect(violation.invoiceId).toBe('INV-001');
    expect(violation.violationType).toBe('BROKEN_CHAIN');
    expect(violation.description).toContain('ACC-A');
    expect(violation.description).toContain('ACC-B');

    expect(result.statusCorrespondenceViolations).toEqual([]);
    expect(result.amountDiscrepancies).toEqual([]);

    expect(result.abnormalCasesList).toHaveLength(1);
    const abnormalCase = result.abnormalCasesList[0];
    expect(abnormalCase.dealId).toBe('DEAL-001');
    expect(abnormalCase.invoiceId).toBe('INV-001');
    expect(abnormalCase.violationTypes).toContain('BROKEN_CHAIN');
    expect(abnormalCase.severity).toBe('HIGH');
    expect(abnormalCase.correctionRequired).toBe(true);

    expect(result.executionTimestamp).toEqual(executionTimestamp);
  });
});
