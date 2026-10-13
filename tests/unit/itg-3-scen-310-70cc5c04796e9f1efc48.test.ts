import { formatCSVExportData, CSVFormatGenerationError } from '../../src/logic/dashboard-presentation';
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

describe('SCEN-310: 選択された差異レコードにデータ型不正またはフィールド値欠損がある場合、CSVFormatGenerationErrorが発生する', () => {
  it('差異レコード内のフィールド値欠損（amount が null）の場合、CSVFormatGenerationErrorが発生する', async () => {
    (authValidation.validateUserAuthorizationForCSVExport as jest.Mock).mockResolvedValue({
      authorized: true,
    });

    (discrepancyPersistence.retrieveDiscrepanciesForCSVExport as jest.Mock).mockResolvedValue({
      discrepancies: [
        {
          discrepancyId: 'discrepancy-A1',
          legacySystemInvoiceId: 'legacy-A1',
          newSystemInvoiceId: 'new-A1',
          discrepancyType: 'INVOICE_AMOUNT_MISMATCH',
          discrepancyContent: 'Amount mismatch',
          amountDifference: null,
          countDifference: undefined,
          statusDifference: undefined,
          detectionDateTime: '2026-10-06T08:00:00Z',
          severity: 'pending',
          causeClassification: null,
          toleranceJudgment: null,
          toleranceJudgmentDateTime: null,
          judgedByUserId: null,
          legacySystemInvoice: {
            invoiceId: 'legacy-A1',
            invoiceNumber: 'INV-LEGACY-001',
            invoiceDate: '2026-10-06',
            invoiceAmount: 1000,
            taxAmount: 100,
            status: 'issued',
            paymentDueDate: '2026-11-06',
            remarks: 'Test',
          },
          newSystemInvoice: {
            invoiceId: 'new-A1',
            invoiceNumber: 'INV-NEW-001',
            invoiceDate: '2026-10-06',
            invoiceAmount: 900,
            taxAmount: 90,
            status: 'issued',
            paymentDueDate: '2026-11-06',
            remarks: 'Test',
            dealId: undefined,
          },
          correctionTrackingHistory: [],
          confirmationHistory: [],
        },
        {
          discrepancyId: 'discrepancy-B2',
          legacySystemInvoiceId: 'legacy-B2',
          newSystemInvoiceId: 'new-B2',
          discrepancyType: 'INVOICE_AMOUNT_MISMATCH',
          discrepancyContent: 'Amount mismatch',
          amountDifference: 50000,
          countDifference: undefined,
          statusDifference: undefined,
          detectionDateTime: '2026-10-05T09:15:00Z',
          severity: 'completed',
          causeClassification: null,
          toleranceJudgment: null,
          toleranceJudgmentDateTime: null,
          judgedByUserId: null,
          legacySystemInvoice: {
            invoiceId: 'legacy-B2',
            invoiceNumber: 'INV-LEGACY-002',
            invoiceDate: '2026-10-05',
            invoiceAmount: 2000,
            taxAmount: 200,
            status: 'issued',
            paymentDueDate: '2026-11-05',
            remarks: 'Test',
          },
          newSystemInvoice: {
            invoiceId: 'new-B2',
            invoiceNumber: 'INV-NEW-002',
            invoiceDate: '2026-10-05',
            invoiceAmount: 1950,
            taxAmount: 195,
            status: 'issued',
            paymentDueDate: '2026-11-05',
            remarks: 'Test',
            dealId: undefined,
          },
          correctionTrackingHistory: [
            {
              correctionId: 'corr-B2-001',
              differenceId: 'discrepancy-B2',
              correctionMethod: 'manual',
              correctionStatus: 'completed',
              correctionExecutorUserId: 'user-002',
              correctionExecutionDateTime: '2026-10-06T14:00:00Z',
              dataBeforeCorrection: '{}',
              dataAfterCorrection: '{}',
              verificationResult: 'pass',
            },
          ],
          confirmationHistory: [],
        },
      ],
      totalCount: 2,
    });

    (toleranceCriteria.getAllToleranceCriteria as jest.Mock).mockResolvedValue([
      {
        criteriaId: 'criteria-1',
        discrepancyType: 'INVOICE_AMOUNT_MISMATCH',
        toleranceAmount: 500,
        toleranceCount: null,
        toleranceStatusDifference: null,
      },
    ]);

    const input = {
      requestUserId: 'user-001',
      selectedDiscrepancyIds: ['discrepancy-A1', 'discrepancy-B2'],
      exportDateTime: new Date('2026-10-07T10:30:00Z'),
    };

    await expect(formatCSVExportData(input)).rejects.toThrow(CSVFormatGenerationError);
    await expect(formatCSVExportData(input)).rejects.toThrow('CSV形式への変換に失敗しました。');
  });
});
