import { formatCSVExportData } from '../../src/logic/dashboard-presentation';
import * as authValidation from '../../src/logic/authorization-validation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as toleranceCriteria from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/authorization-validation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authorization-validation')>('../../src/logic/authorization-validation'),
  validateUserAuthorizationForCSVExport: jest.fn(),
}));
jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepanciesForCSVExport: jest.fn(),
}));
jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getAllToleranceCriteria: jest.fn(),
}));

describe('SCEN-312: 複数の差異レコードが選択された場合、全件数がtotalRowCountに正確に反映される', () => {
  it('5件の差異レコードが選択された場合、すべてが CSV 行データに変換され、totalRowCount が 5 となる', async () => {
    (authValidation.validateUserAuthorizationForCSVExport as jest.Mock).mockResolvedValue({
      userId: 'user-001',
      hasCSVExportPermission: true,
    });

    const mockDiscrepancies = [
      {
        discrepancyId: 'disc-101',
        legacySystemInvoiceId: 'legacy-101',
        newSystemInvoiceId: 'new-101',
        discrepancyType: 'INVOICE_AMOUNT_MISMATCH',
        discrepancyContent: 'Amount mismatch',
        amountDifference: 500,
        countDifference: null,
        statusDifference: null,
        detectionDateTime: '2026-01-15T00:00:00.000Z',
        severity: 'high',
        causeClassification: null,
        toleranceJudgment: 'within_tolerance',
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
        legacySystemInvoice: {
          invoiceId: 'legacy-101',
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-01-10',
          invoiceAmount: 10000,
          taxAmount: 1000,
          status: 'issued',
          paymentDueDate: '2026-02-10',
          remarks: 'Test invoice',
        },
        newSystemInvoice: {
          invoiceId: 'new-101',
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-01-10',
          invoiceAmount: 10500,
          taxAmount: 1050,
          status: 'issued',
          paymentDueDate: '2026-02-10',
          remarks: 'Test invoice',
          dealId: 'deal-101',
        },
        correctionTrackingHistory: [],
        confirmationHistory: [
          {
            confirmationId: 'conf-101',
            discrepancyId: 'disc-101',
            confirmationUserId: 'user-001',
            confirmationDateTime: '2026-01-15T09:00:00.000Z',
            confirmationContent: '金額差異を確認',
            judgmentResult: 'confirmed',
          },
        ],
      },
      {
        discrepancyId: 'disc-102',
        legacySystemInvoiceId: 'legacy-102',
        newSystemInvoiceId: 'new-102',
        discrepancyType: 'INVOICE_COUNT_MISMATCH',
        discrepancyContent: 'Count mismatch',
        amountDifference: null,
        countDifference: 1,
        statusDifference: null,
        detectionDateTime: '2026-01-14T00:00:00.000Z',
        severity: 'medium',
        causeClassification: null,
        toleranceJudgment: 'within_tolerance',
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
        legacySystemInvoice: {
          invoiceId: 'legacy-102',
          invoiceNumber: 'INV-2026-002',
          invoiceDate: '2026-01-11',
          invoiceAmount: 5000,
          taxAmount: 500,
          status: 'issued',
          paymentDueDate: '2026-02-11',
          remarks: 'Test invoice',
        },
        newSystemInvoice: {
          invoiceId: 'new-102',
          invoiceNumber: 'INV-2026-002',
          invoiceDate: '2026-01-11',
          invoiceAmount: 5000,
          taxAmount: 500,
          status: 'issued',
          paymentDueDate: '2026-02-11',
          remarks: 'Test invoice',
          dealId: 'deal-102',
        },
        correctionTrackingHistory: [],
        confirmationHistory: [],
      },
      {
        discrepancyId: 'disc-103',
        legacySystemInvoiceId: 'legacy-103',
        newSystemInvoiceId: 'new-103',
        discrepancyType: 'INVOICE_AMOUNT_MISMATCH',
        discrepancyContent: 'Amount match',
        amountDifference: 0,
        countDifference: null,
        statusDifference: null,
        detectionDateTime: '2026-01-13T00:00:00.000Z',
        severity: 'low',
        causeClassification: null,
        toleranceJudgment: 'within_tolerance',
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
        legacySystemInvoice: {
          invoiceId: 'legacy-103',
          invoiceNumber: 'INV-2026-003',
          invoiceDate: '2026-01-12',
          invoiceAmount: 20000,
          taxAmount: 2000,
          status: 'issued',
          paymentDueDate: '2026-02-12',
          remarks: 'Test invoice',
        },
        newSystemInvoice: {
          invoiceId: 'new-103',
          invoiceNumber: 'INV-2026-003',
          invoiceDate: '2026-01-12',
          invoiceAmount: 20000,
          taxAmount: 2000,
          status: 'issued',
          paymentDueDate: '2026-02-12',
          remarks: 'Test invoice',
          dealId: 'deal-103',
        },
        correctionTrackingHistory: [],
        confirmationHistory: [
          {
            confirmationId: 'conf-103',
            discrepancyId: 'disc-103',
            confirmationUserId: 'user-002',
            confirmationDateTime: '2026-01-15T08:15:00.000Z',
            confirmationContent: '是正完了',
            judgmentResult: 'resolved',
          },
        ],
      },
      {
        discrepancyId: 'disc-104',
        legacySystemInvoiceId: 'legacy-104',
        newSystemInvoiceId: 'new-104',
        discrepancyType: 'INVOICE_AMOUNT_MISMATCH',
        discrepancyContent: 'Amount mismatch',
        amountDifference: -200,
        countDifference: null,
        statusDifference: null,
        detectionDateTime: '2026-01-12T00:00:00.000Z',
        severity: 'low',
        causeClassification: null,
        toleranceJudgment: 'within_tolerance',
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
        legacySystemInvoice: {
          invoiceId: 'legacy-104',
          invoiceNumber: 'INV-2026-004',
          invoiceDate: '2026-01-13',
          invoiceAmount: 15000,
          taxAmount: 1500,
          status: 'issued',
          paymentDueDate: '2026-02-13',
          remarks: 'Test invoice',
        },
        newSystemInvoice: {
          invoiceId: 'new-104',
          invoiceNumber: 'INV-2026-004',
          invoiceDate: '2026-01-13',
          invoiceAmount: 14800,
          taxAmount: 1480,
          status: 'issued',
          paymentDueDate: '2026-02-13',
          remarks: 'Test invoice',
          dealId: 'deal-104',
        },
        correctionTrackingHistory: [],
        confirmationHistory: [],
      },
      {
        discrepancyId: 'disc-105',
        legacySystemInvoiceId: 'legacy-105',
        newSystemInvoiceId: 'new-105',
        discrepancyType: 'STATUS_MISMATCH',
        discrepancyContent: 'Status mismatch',
        amountDifference: null,
        countDifference: null,
        statusDifference: 'MISMATCH',
        detectionDateTime: '2026-01-11T00:00:00.000Z',
        severity: 'medium',
        causeClassification: null,
        toleranceJudgment: 'within_tolerance',
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
        legacySystemInvoice: {
          invoiceId: 'legacy-105',
          invoiceNumber: 'INV-2026-005',
          invoiceDate: '2026-01-14',
          invoiceAmount: 25000,
          taxAmount: 2500,
          status: 'ISSUED',
          paymentDueDate: '2026-02-14',
          remarks: 'Test invoice',
        },
        newSystemInvoice: {
          invoiceId: 'new-105',
          invoiceNumber: 'INV-2026-005',
          invoiceDate: '2026-01-14',
          invoiceAmount: 25000,
          taxAmount: 2500,
          status: 'DRAFT',
          paymentDueDate: '2026-02-14',
          remarks: 'Test invoice',
          dealId: 'deal-105',
        },
        correctionTrackingHistory: [],
        confirmationHistory: [
          {
            confirmationId: 'conf-105',
            discrepancyId: 'disc-105',
            confirmationUserId: 'user-001',
            confirmationDateTime: '2026-01-15T09:45:00.000Z',
            confirmationContent: 'ステータス差異を確認',
            judgmentResult: 'confirmed',
          },
        ],
      },
    ];

    (discrepancyPersistence.retrieveDiscrepanciesForCSVExport as jest.Mock).mockResolvedValue({
      discrepancies: mockDiscrepancies,
      totalCount: 5,
    });

    (toleranceCriteria.getAllToleranceCriteria as jest.Mock).mockResolvedValue([
      {
        criteriaId: 'criteria-1',
        discrepancyType: 'INVOICE_AMOUNT_MISMATCH',
        toleranceAmount: 1000,
        toleranceCount: null,
        toleranceStatusDifference: null,
      },
      {
        criteriaId: 'criteria-2',
        discrepancyType: 'INVOICE_COUNT_MISMATCH',
        toleranceAmount: null,
        toleranceCount: 2,
        toleranceStatusDifference: null,
      },
      {
        criteriaId: 'criteria-3',
        discrepancyType: 'STATUS_MISMATCH',
        toleranceAmount: null,
        toleranceCount: null,
        toleranceStatusDifference: 'ALLOWED_STATUS_SET',
      },
    ]);

    const input = {
      requestUserId: 'user-001',
      selectedDiscrepancyIds: ['disc-101', 'disc-102', 'disc-103', 'disc-104', 'disc-105'],
      exportDateTime: new Date('2026-01-15T10:30:00.000Z'),
    };

    const result = await formatCSVExportData(input);

    expect(result.csvRows).toHaveLength(5);
    expect(result.totalRowCount).toBe(5);
    expect(result.exportFileIdentifier).toBeDefined();

    // Verify each CSV row contains the expected discrepancy data
    expect(result.csvRows[0].discrepancyId).toBe('disc-101');
    expect(result.csvRows[0].legacyInvoiceId).toBe('legacy-101');
    expect(result.csvRows[0].newInvoiceId).toBe('new-101');
    expect(result.csvRows[0].discrepancyType).toBe('INVOICE_AMOUNT_MISMATCH');
    expect(result.csvRows[0].amountDifference).toBe(500);

    expect(result.csvRows[1].discrepancyId).toBe('disc-102');
    expect(result.csvRows[1].discrepancyType).toBe('INVOICE_COUNT_MISMATCH');
    expect(result.csvRows[1].countDifference).toBe(1);

    expect(result.csvRows[2].discrepancyId).toBe('disc-103');
    expect(result.csvRows[2].discrepancyType).toBe('INVOICE_AMOUNT_MISMATCH');
    expect(result.csvRows[2].amountDifference).toBe(0);

    expect(result.csvRows[3].discrepancyId).toBe('disc-104');
    expect(result.csvRows[3].amountDifference).toBe(-200);

    expect(result.csvRows[4].discrepancyId).toBe('disc-105');
    expect(result.csvRows[4].discrepancyType).toBe('STATUS_MISMATCH');
    expect(result.csvRows[4].statusDifference).toBe('MISMATCH');
  });
});
