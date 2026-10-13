import { confirmDiscrepancyDetail } from '../../src/logic/discrepancy-confirmation-usecase';
import type { ConfirmDiscrepancyDetailInput } from '../../src/logic/discrepancy-confirmation-usecase';
import * as authValidation from '../../src/logic/authorization-validation';
import * as discrepancyPersistence from '../../src/logic/discrepancy-persistence';
import * as discrepancyTolerance from '../../src/logic/discrepancy-tolerance-criteria';

jest.mock('../../src/logic/authorization-validation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authorization-validation')>('../../src/logic/authorization-validation'),
  validateUserAuthorizationForDiscrepancyConfirmation: jest.fn(),
  validateDiscrepancyConfirmationInputs: jest.fn(),
}));

jest.mock('../../src/logic/discrepancy-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-persistence')>('../../src/logic/discrepancy-persistence'),
  retrieveDiscrepancyDetailsForConfirmation: jest.fn(),
}));

jest.mock('../../src/logic/discrepancy-tolerance-criteria', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-tolerance-criteria')>('../../src/logic/discrepancy-tolerance-criteria'),
  getToleranceCriteriaByDiscrepancyType: jest.fn(),
}));

describe('SCEN-123: 境界系 - 許容範囲判定の結果が「超過」', () => {
  const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
  const confirmingUserId = '660e8400-e29b-41d4-a716-446655440001';
  const confirmationContent = '金額差異が契約許容範囲を超過したため是正が必要';
  const currentDateTime = new Date('2026-01-15T10:30:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();

    (authValidation.validateUserAuthorizationForDiscrepancyConfirmation as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: confirmingUserId,
      authorizedAt: '2026-01-15T10:30:00.000Z',
    });

    (authValidation.validateDiscrepancyConfirmationInputs as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedAt: '2026-01-15T10:30:00.000Z',
    });

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue({
      discrepancyId,
      discrepancyDetection: {
        discrepancyId,
        legacySystemInvoiceId: 'INV-SF-2026-001',
        newSystemInvoiceId: 'INV-NEW-2026-001',
        discrepancyType: 'INVOICE_AMOUNT_DIFFERENCE',
        discrepancyContent: 'Amount difference between systems',
        amountDifference: 50000,
        countDifference: 0,
        statusDifference: null,
        detectionDateTime: '2026-01-14T15:20:00.000Z',
        severity: 'HIGH',
        causeClassification: null,
        toleranceJudgment: null,
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
      },
      legacySystemInvoice: {
        invoiceId: 'INV-SF-2026-001',
        invoiceNumber: 'INV-SF-2026-001',
        invoiceDate: '2026-01-10',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: 'confirmed',
        paymentDueDate: '2026-02-10',
        remarks: '',
      },
      newSystemInvoice: {
        invoiceId: 'INV-NEW-2026-001',
        invoiceNumber: 'INV-NEW-2026-001',
        invoiceDate: '2026-01-10',
        invoiceAmount: 950000,
        taxAmount: 100000,
        status: 'confirmed',
        paymentDueDate: '2026-02-10',
        remarks: '',
      },
      correctionTrackingHistory: [],
      confirmationHistory: [],
    });

    (discrepancyTolerance.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue({
      criteriaId: 'crit-003',
      discrepancyType: 'INVOICE_AMOUNT_DIFFERENCE',
      toleranceAmount: 30000,
      toleranceCount: null,
      toleranceStatusDifference: null,
    });
  });

  it('should return output with isWithinTolerance=false when difference exceeds tolerance', async () => {
    const input: ConfirmDiscrepancyDetailInput = {
      discrepancyId,
      confirmingUserId,
      confirmationContent,
      currentDateTime,
    };

    const result = await confirmDiscrepancyDetail(input);

    expect(result).toBeDefined();
    expect(result.discrepancyId).toBe(discrepancyId);

    expect(result.legacyInvoiceData).toBeDefined();
    expect(result.legacyInvoiceData.invoiceNumber).toBe('INV-SF-2026-001');
    expect(result.legacyInvoiceData.invoiceAmount).toBe(1000000);

    expect(result.newSystemInvoiceData).toBeDefined();
    expect(result.newSystemInvoiceData.invoiceNumber).toBe('INV-NEW-2026-001');
    expect(result.newSystemInvoiceData.invoiceAmount).toBe(950000);

    expect(result.discrepancyDetails).toBeDefined();

    expect(result.toleranceJudgment).toBeDefined();
    expect(result.toleranceJudgment.isWithinTolerance).toBe(false);

    expect(result.confirmationRecordId).toBeDefined();
    expect(typeof result.confirmationRecordId).toBe('string');
  });
});
