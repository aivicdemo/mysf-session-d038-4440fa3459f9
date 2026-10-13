import { validateDataIntegrityForMonthlyClose } from '../../src/logic/data-integrity-validation-engine';

describe('SCEN-071: 複数の違反タイプ（参照不在・ステータス不整合・金額ズレ）が混在するとき', () => {
  it('全ての違反を分類して異常案件一覧に含める', async () => {
    const dealRecords = [
      {
        dealId: 'DEAL-001',
        accountId: 'ACC-001',
        dealStatus: 'Closed Won',
        dealAmount: 100000,
        invoiceIds: ['INV-001'],
      },
      {
        dealId: 'DEAL-002',
        accountId: 'ACC-002',
        dealStatus: 'Closed Won',
        dealAmount: 50000,
        invoiceIds: ['INV-002'],
      },
      {
        dealId: 'DEAL-003',
        accountId: 'ACC-003',
        dealStatus: 'Closed Won',
        dealAmount: 75000,
        invoiceIds: ['INV-003', 'INV-004'],
      },
    ];
    const invoiceRecords = [
      {
        invoiceId: 'INV-001',
        accountId: 'ACC-999',
        dealId: 'DEAL-001',
        invoiceStatus: 'Draft',
        invoiceAmount: 100000,
      },
      {
        invoiceId: 'INV-002',
        accountId: 'ACC-002',
        dealId: 'DEAL-002',
        invoiceStatus: 'Invoiced',
        invoiceAmount: 52000,
      },
      {
        invoiceId: 'INV-003',
        accountId: 'ACC-003',
        dealId: 'DEAL-004',
        invoiceStatus: 'Paid',
        invoiceAmount: 40000,
      },
      {
        invoiceId: 'INV-004',
        accountId: 'ACC-003',
        dealId: 'DEAL-003',
        invoiceStatus: 'Paid',
        invoiceAmount: 35000,
      },
    ];
    const statusCorrespondenceRules = [
      {
        dealStatus: 'Closed Won',
        allowedInvoiceStatuses: ['Invoiced', 'Paid'],
      },
    ];
    const amountToleranceCriteria = {
      tolerancePercentage: 5,
      toleranceAbsoluteAmount: 3000,
    };
    const executionTimestamp = new Date('2025-01-15T10:30:00Z');

    const result = await validateDataIntegrityForMonthlyClose({
      dealRecords,
      invoiceRecords,
      statusCorrespondenceRules,
      amountToleranceCriteria,
      executionTimestamp,
    });

    expect(result.validationResult).toBe('FAILED_WITH_VIOLATIONS');
    expect(result.totalDealsValidated).toBe(3);
    expect(result.totalInvoicesValidated).toBe(4);

    expect(result.referentialIntegrityViolations.length).toBe(2);
    expect(result.referentialIntegrityViolations).toContainEqual(
      expect.objectContaining({
        dealId: 'DEAL-001',
        invoiceId: 'INV-001',
        violationType: 'MISSING_REFERENCE',
        description: expect.stringContaining('ACC-001'),
      })
    );
    expect(result.referentialIntegrityViolations).toContainEqual(
      expect.objectContaining({
        dealId: 'DEAL-003',
        invoiceId: 'INV-003',
        violationType: 'BROKEN_CHAIN',
        description: expect.stringContaining('DEAL-004'),
      })
    );

    expect(result.statusCorrespondenceViolations.length).toBe(1);
    expect(result.statusCorrespondenceViolations).toContainEqual(
      expect.objectContaining({
        dealId: 'DEAL-001',
        invoiceId: 'INV-001',
        dealStatus: 'Closed Won',
        invoiceStatus: 'Draft',
        description: expect.stringContaining('Closed Won'),
      })
    );

    expect(result.amountDiscrepancies.length).toBe(1);
    expect(result.amountDiscrepancies).toContainEqual(
      expect.objectContaining({
        dealId: 'DEAL-002',
        invoiceId: 'INV-002',
        dealAmount: 50000,
        invoiceAmount: 52000,
        discrepancyAmount: 2000,
        discrepancyPercentage: 4.0,
        withinTolerance: true,
      })
    );

    expect(result.abnormalCasesList.length).toBe(3);
    expect(result.abnormalCasesList[0]).toEqual(
      expect.objectContaining({
        dealId: 'DEAL-001',
        invoiceId: 'INV-001',
        violationTypes: expect.arrayContaining(['MISSING_REFERENCE', 'STATUS_MISMATCH']),
        severity: 'CRITICAL',
        correctionRequired: true,
        assignedTo: null,
      })
    );
    expect(result.abnormalCasesList[1]).toEqual(
      expect.objectContaining({
        dealId: 'DEAL-003',
        invoiceId: 'INV-003',
        violationTypes: expect.arrayContaining(['BROKEN_CHAIN']),
        severity: 'HIGH',
        correctionRequired: true,
        assignedTo: null,
      })
    );
    expect(result.abnormalCasesList[2]).toEqual(
      expect.objectContaining({
        dealId: 'DEAL-002',
        invoiceId: 'INV-002',
        violationTypes: expect.arrayContaining(['AMOUNT_DISCREPANCY_WITHIN_TOLERANCE']),
        severity: 'MEDIUM',
        correctionRequired: false,
        assignedTo: null,
      })
    );

    expect(result.executionTimestamp).toEqual(new Date('2025-01-15T10:30:00Z'));
  });
});
