import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';
import type { ValidateDataIntegrityForMonthlyCloseInput } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-077: 異常案件の重大度が参照違反・ステータス違反・金額ズレの種類に応じて正確に分類される', () => {
  it('異常案件が適切に分類され、重大度と違反タイプが正確に記録される', async () => {
    // Preconditions setup
    const executionTimestamp = new Date('2026-01-15T10:30:00Z');

    const dealRecords = [
      {
        dealId: 'DEAL-001',
        accountId: 'ACC-001',
        dealStatus: '成約',
        dealAmount: 100000,
        invoiceIds: ['INV-001'],
      },
      {
        dealId: 'DEAL-002',
        accountId: 'ACC-002',
        dealStatus: '成約',
        dealAmount: 50000,
        invoiceIds: ['INV-002'],
      },
      {
        dealId: 'DEAL-003',
        accountId: 'ACC-003',
        dealStatus: '成約',
        dealAmount: 75000,
        invoiceIds: ['INV-003'],
      },
    ];

    const invoiceRecords = [
      {
        invoiceId: 'INV-001',
        accountId: 'ACC-001',
        dealId: 'DEAL-001',
        invoiceStatus: '請求済み',
        invoiceAmount: 100000,
      },
      {
        invoiceId: 'INV-002',
        accountId: 'ACC-002',
        dealId: 'DEAL-002',
        invoiceStatus: 'ドラフト',
        invoiceAmount: 50000,
      },
      {
        invoiceId: 'INV-003',
        accountId: 'ACC-003',
        dealId: 'DEAL-003',
        invoiceStatus: '請求済み',
        invoiceAmount: 76000,
      },
    ];

    const statusCorrespondenceRules = [
      {
        dealStatus: '成約',
        allowedInvoiceStatuses: ['請求済み', '入金済み'],
      },
    ];

    const amountToleranceCriteria = {
      tolerancePercentage: 2,
      toleranceAbsoluteAmount: 1500,
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
    expect(output.validationResult).toBe('FAILED_WITH_VIOLATIONS');

    expect(output.totalDealsValidated).toBe(3);
    expect(output.totalInvoicesValidated).toBe(3);

    // statusCorrespondenceViolations に DEAL-002 の違反が含まれる
    const statusViolation = output.statusCorrespondenceViolations.find(
      (v) => v.dealId === 'DEAL-002' && v.invoiceId === 'INV-002'
    );
    expect(statusViolation).toBeDefined();
    if (statusViolation) {
      expect(statusViolation.dealStatus).toBe('成約');
      expect(statusViolation.invoiceStatus).toBe('ドラフト');
      expect(statusViolation.description).toContain('ステータス対応ルール検証エラー');
    }

    // amountDiscrepancies に DEAL-003 の金額ズレが含まれる
    const amountDiscrepancy = output.amountDiscrepancies.find(
      (d) => d.dealId === 'DEAL-003' && d.invoiceId === 'INV-003'
    );
    expect(amountDiscrepancy).toBeDefined();
    if (amountDiscrepancy) {
      expect(amountDiscrepancy.dealAmount).toBe(75000);
      expect(amountDiscrepancy.invoiceAmount).toBe(76000);
      expect(amountDiscrepancy.discrepancyAmount).toBe(1000);
      expect(Math.abs(amountDiscrepancy.discrepancyPercentage - 1.33)).toBeLessThan(0.01);
      expect(amountDiscrepancy.withinTolerance).toBe(true);
    }

    // abnormalCasesList が適切に分類されている
    // DEAL-002: StatusCorrespondenceViolation, severity HIGH, correctionRequired true
    const deal002Case = output.abnormalCasesList.find((c) => c.dealId === 'DEAL-002');
    expect(deal002Case).toBeDefined();
    if (deal002Case) {
      expect(deal002Case.invoiceId).toBe('INV-002');
      expect(deal002Case.violationTypes).toContain('StatusCorrespondenceViolation');
      expect(deal002Case.severity).toBe('HIGH');
      expect(deal002Case.correctionRequired).toBe(true);
      expect(deal002Case.assignedTo).toBeNull();
    }

    // DEAL-003: AmountDiscrepancyDetected, severity MEDIUM, correctionRequired false (許容範囲内)
    const deal003Case = output.abnormalCasesList.find((c) => c.dealId === 'DEAL-003');
    expect(deal003Case).toBeDefined();
    if (deal003Case) {
      expect(deal003Case.invoiceId).toBe('INV-003');
      expect(deal003Case.violationTypes).toContain('AmountDiscrepancyDetected');
      expect(deal003Case.severity).toBe('MEDIUM');
      expect(deal003Case.correctionRequired).toBe(false);
      expect(deal003Case.assignedTo).toBeNull();
    }
  });
});
