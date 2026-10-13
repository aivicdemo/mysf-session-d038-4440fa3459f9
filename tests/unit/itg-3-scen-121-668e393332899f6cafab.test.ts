import { confirmDiscrepancyDetail, ToleranceCriteriaNotFoundError } from '../../src/logic/discrepancy-confirmation-usecase';
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

describe('SCEN-121: エラー系 - 許容基準が定義されていない', () => {
  const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
  const confirmingUserId = '660e8400-e29b-41d4-a716-446655440001';
  const confirmationContent = '旧システムのデータが古いバージョンのまま更新されていないことを確認';
  const currentDateTime = new Date('2026-01-15T10:30:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();

    (authValidation.validateDiscrepancyConfirmationInputs as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedAt: '2026-01-15T10:30:00.000Z',
    });

    (authValidation.validateUserAuthorizationForDiscrepancyConfirmation as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: confirmingUserId,
      authorizedAt: '2026-01-15T10:30:00.000Z',
    });

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue({
      discrepancyId,
      discrepancyDetection: {
        discrepancyId,
        legacySystemInvoiceId: 'SF-INV-2025-001',
        newSystemInvoiceId: 'NEW-INV-2025-001',
        discrepancyType: 'INVOICE_AMOUNT_MISMATCH',
        discrepancyContent: 'Invoice amount mismatch',
        amountDifference: 100,
        countDifference: null,
        statusDifference: null,
        detectionDateTime: '2026-01-14T15:20:00.000Z',
        severity: 'HIGH',
        causeClassification: null,
        toleranceJudgment: null,
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
      },
      legacySystemInvoice: {
        invoiceId: 'SF-INV-2025-001',
        invoiceNumber: 'SF-INV-2025-001',
        invoiceDate: '2026-01-10',
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: 'confirmed',
        paymentDueDate: '2026-02-10',
        remarks: '',
      },
      newSystemInvoice: {
        invoiceId: 'NEW-INV-2025-001',
        invoiceNumber: 'NEW-INV-2025-001',
        invoiceDate: '2026-01-10',
        invoiceAmount: 99900,
        taxAmount: 10000,
        status: 'confirmed',
        paymentDueDate: '2026-02-10',
        remarks: '',
      },
      correctionTrackingHistory: [],
      confirmationHistory: [],
    });

    (discrepancyTolerance.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue(null);
  });

  it('should throw ToleranceCriteriaNotFoundError when tolerance criteria is not defined', async () => {
    const input: ConfirmDiscrepancyDetailInput = {
      discrepancyId,
      confirmingUserId,
      confirmationContent,
      currentDateTime,
    };

    await expect(confirmDiscrepancyDetail(input)).rejects.toThrow(ToleranceCriteriaNotFoundError);

    await expect(confirmDiscrepancyDetail(input)).rejects.toThrow(
      '差異種類に対応する許容基準が定義されていません。'
    );
  });
});
