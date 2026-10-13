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

describe('SCEN-122: 境界系 - 許容範囲判定の結果が「許容範囲内」', () => {
  const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
  const confirmingUserId = '660e8400-e29b-41d4-a716-446655440001';
  const confirmationContent = '請求金額の小数点以下の丸め処理により発生した差異。業務上問題なし。';
  const currentDateTime = new Date('2026-10-07T10:30:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();

    (authValidation.validateUserAuthorizationForDiscrepancyConfirmation as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: confirmingUserId,
      authorizedAt: '2026-10-07T10:30:00.000Z',
    });

    (authValidation.validateDiscrepancyConfirmationInputs as jest.Mock).mockResolvedValue({
      isValid: true,
      validatedAt: '2026-10-07T10:30:00.000Z',
    });

    (discrepancyPersistence.retrieveDiscrepancyDetailsForConfirmation as jest.Mock).mockResolvedValue({
      discrepancyId,
      discrepancyDetection: {
        discrepancyId,
        legacySystemInvoiceId: 'SF-INV-2026-001',
        newSystemInvoiceId: 'NEW-INV-2026-001',
        discrepancyType: '金額差異',
        discrepancyContent: '小数点以下の丸め処理による差異',
        amountDifference: 0.01,
        countDifference: 0,
        statusDifference: null,
        detectionDateTime: '2026-10-07T09:00:00.000Z',
        severity: '低',
        causeClassification: null,
        toleranceJudgment: null,
        toleranceJudgmentDateTime: null,
        judgedByUserId: null,
      },
      legacySystemInvoice: {
        invoiceId: 'SF-INV-2026-001',
        invoiceNumber: 'SF-INV-2026-001',
        invoiceDate: '2026-10-01',
        invoiceAmount: 10000.5,
        taxAmount: 1000,
        status: '確定',
        paymentDueDate: '2026-10-31',
        remarks: '',
      },
      newSystemInvoice: {
        invoiceId: 'NEW-INV-2026-001',
        invoiceNumber: 'NEW-INV-2026-001',
        invoiceDate: '2026-10-01',
        invoiceAmount: 10000.51,
        taxAmount: 1000,
        status: '確定',
        paymentDueDate: '2026-10-31',
        remarks: '',
      },
      correctionTrackingHistory: [],
      confirmationHistory: [],
    });

    (discrepancyTolerance.getToleranceCriteriaByDiscrepancyType as jest.Mock).mockResolvedValue({
      criteriaId: 'crit-002',
      discrepancyType: '金額差異',
      toleranceAmount: 1.0,
      toleranceCount: null,
      toleranceStatusDifference: null,
    });
  });

  it('should return output with isWithinTolerance=true when difference is within tolerance', async () => {
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
    expect(result.legacyInvoiceData.invoiceAmount).toBe(10000.5);

    expect(result.newSystemInvoiceData).toBeDefined();
    expect(result.newSystemInvoiceData.invoiceAmount).toBe(10000.51);

    expect(result.discrepancyDetails).toBeDefined();

    expect(result.toleranceJudgment).toBeDefined();
    expect(result.toleranceJudgment.isWithinTolerance).toBe(true);

    expect(result.confirmationRecordId).toBeDefined();
    expect(typeof result.confirmationRecordId).toBe('string');
  });
});
