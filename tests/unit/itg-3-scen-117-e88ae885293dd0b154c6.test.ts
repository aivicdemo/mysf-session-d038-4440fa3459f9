import { confirmDiscrepancyDetail, UnauthorizedUserError } from '../../src/logic/discrepancy-confirmation-usecase';
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

describe('SCEN-117: 正常系 - 営業部システム担当が権限を持ち、有効な入力値で差異確認を実施', () => {
  const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
  const confirmingUserId = '660e8400-e29b-41d4-a716-446655440001';
  const confirmationContent = '金額差異は取引先マスタの税率変更により発生。新システムの計算が正確。承認可能。';
  const currentDateTime = new Date('2026-10-07T10:30:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    (authValidation.validateUserAuthorizationForDiscrepancyConfirmation as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: confirmingUserId,
      authorizedAt: '2026-10-07T10:30:00Z',
    });

    (authValidation.validateDiscrepancyConfirmationInputs as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedAt: '2026-10-07T10:30:00Z',
    });

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue({
      discrepancyId,
      discrepancyDetection: {
        discrepancyId,
        legacySystemInvoiceId: 'SF-INV-20261001',
        newSystemInvoiceId: 'NEW-INV-20261001',
        discrepancyType: 'AMOUNT_DIFFERENCE',
        discrepancyContent: 'Amount mismatch between systems',
        amountDifference: 0,
        countDifference: null,
        statusDifference: null,
        detectionDateTime: '2026-10-06T15:20:00Z',
        severity: 'LOW',
        causeClassification: null,
        toleranceJudgment: null,
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
      },
      legacySystemInvoice: {
        invoiceId: 'SF-INV-20261001',
        invoiceNumber: 'SF-INV-20261001',
        invoiceDate: '2026-10-01',
        invoiceAmount: 1100000,
        taxAmount: 100000,
        status: 'Approved',
        paymentDueDate: '2026-10-31',
        remarks: '',
      },
      newSystemInvoice: {
        invoiceId: 'NEW-INV-20261001',
        invoiceNumber: 'NEW-INV-20261001',
        invoiceDate: '2026-10-01',
        invoiceAmount: 1100000,
        taxAmount: 100000,
        status: 'Posted',
        paymentDueDate: '2026-10-31',
        remarks: '',
      },
      correctionTrackingHistory: [],
      confirmationHistory: [],
    });

    (discrepancyTolerance.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue({
      criteriaId: 'crit-001',
      discrepancyType: 'AMOUNT_DIFFERENCE',
      toleranceAmount: 1000,
      toleranceCount: null,
      toleranceStatusDifference: null,
    });
  });

  it('should return ConfirmDiscrepancyDetailOutput with correct data and record confirmation history', async () => {
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
    expect(result.legacyInvoiceData.invoiceNumber).toBe('SF-INV-20261001');
    expect(result.legacyInvoiceData.invoiceAmount).toBe(1100000);
    expect(result.legacyInvoiceData.taxAmount).toBe(100000);
    expect(result.legacyInvoiceData.status).toBe('Approved');

    expect(result.newSystemInvoiceData).toBeDefined();
    expect(result.newSystemInvoiceData.invoiceNumber).toBe('NEW-INV-20261001');
    expect(result.newSystemInvoiceData.invoiceAmount).toBe(1100000);
    expect(result.newSystemInvoiceData.taxAmount).toBe(100000);
    expect(result.newSystemInvoiceData.status).toBe('Posted');

    expect(result.discrepancyDetails).toBeDefined();

    expect(result.toleranceJudgment).toBeDefined();
    expect(result.toleranceJudgment.isWithinTolerance).toBe(true);

    expect(result.confirmationRecordId).toBeDefined();
    expect(typeof result.confirmationRecordId).toBe('string');

    expect(authValidation.validateUserAuthorizationForDiscrepancyConfirmation).toHaveBeenCalled();
    expect(authValidation.validateDiscrepancyConfirmationInputs).toHaveBeenCalled();
    expect(discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation).toHaveBeenCalledWith({
      discrepancyId,
    });
    expect(discrepancyTolerance.getToleranceCriteriaByDiscrepancyType).toHaveBeenCalled();
  });
});
