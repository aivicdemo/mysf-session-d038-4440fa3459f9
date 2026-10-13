import { runTx1Imp1Agent, Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as authValidation from '../../src/logic/authorization-validation';
import * as legacyNewSystemData from '../../src/logic/legacy-new-system-data-retrieval';
import * as discrepancyDetection from '../../src/logic/discrepancy-detection-engine';
import * as dataIntegrityValidation from '../../src/logic/data-integrity-validation-engine';
import * as correctionContentValidation from '../../src/logic/correction-content-validation-engine';

jest.mock('../../src/logic/authorization-validation', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authorization-validation')>('../../src/logic/authorization-validation'),
  validateUserAuthorizationForDiscrepancyConfirmation: jest.fn(),
}));

jest.mock('../../src/logic/legacy-new-system-data-retrieval', () => ({
  ...jest.requireActual<typeof import('../../src/logic/legacy-new-system-data-retrieval')>('../../src/logic/legacy-new-system-data-retrieval'),
  retrieveLegacyAndNewSystemInvoiceData: jest.fn(),
}));

jest.mock('../../src/logic/discrepancy-detection-engine', () => ({
  ...jest.requireActual<typeof import('../../src/logic/discrepancy-detection-engine')>('../../src/logic/discrepancy-detection-engine'),
  detectDiscrepancies: jest.fn(),
}));

jest.mock('../../src/logic/data-integrity-validation-engine', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-integrity-validation-engine')>('../../src/logic/data-integrity-validation-engine'),
  validateDataIntegrityForMonthlyClose: jest.fn(),
}));

jest.mock('../../src/logic/correction-content-validation-engine', () => ({
  ...jest.requireActual<typeof import('../../src/logic/correction-content-validation-engine')>('../../src/logic/correction-content-validation-engine'),
  validateCorrectionContentAndJudgeApproval: jest.fn(),
}));

describe('SCEN-007: エラー：営業担当者による修正内容が承認基準を満たさない場合、CorrectionValidationFailureError が発生する', () => {
  it('CorrectionValidationFailureError がスローされる', async () => {
    (authValidation.validateUserAuthorizationForDiscrepancyConfirmation as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      authorizedAt: '2024-02-05T10:30:00Z',
    });

    (legacyNewSystemData.retrieveLegacyAndNewSystemInvoiceData as jest.Mock).mockResolvedValue({
      legacyInvoices: [
        {
          invoiceId: 'INV-202401-001',
          invoiceNumber: 'INV-202401-001',
          invoiceDate: '2024-01-31',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'posted',
          dueDate: '2024-02-28',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'INV-202401-001',
          invoiceNumber: 'INV-202401-001',
          invoiceDate: '2024-01-31',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'issued',
          dueDate: '2024-02-28',
        },
      ],
      normalizedComparisonData: [],
      extractionTimestamp: '2024-02-05T10:30:00Z',
    });

    (discrepancyDetection.detectDiscrepancies as jest.Mock).mockResolvedValue({
      discrepancies: [],
      totalDiscrepancyCount: 0,
      criticalDiscrepancyCount: 0,
      exceedsToleranceCount: 0,
      summaryReport: {
        totalAmountDifference: 0,
        totalRecordCountDifference: 0,
        statusInconsistencyCount: 0,
        detectionSummary: '差異なし',
      },
    });

    (dataIntegrityValidation.validateDataIntegrityForMonthlyClose as jest.Mock).mockResolvedValue({
      validationResult: 'PASSED',
      totalDealsValidated: 1,
      totalInvoicesValidated: 1,
      referentialIntegrityViolations: [],
      statusCorrespondenceViolations: [],
      amountDiscrepancies: [],
      abnormalCasesList: [],
      executionTimestamp: new Date('2024-02-05T10:30:00Z'),
    });

    (correctionContentValidation.validateCorrectionContentAndJudgeApproval as jest.Mock).mockResolvedValue({
      validationResult: 'rejected',
      correctionDifference: {
        invoiceAmount: { before: 100000, after: 120000 },
      },
      approvalCriteriaMet: false,
      integrityVerificationResult: {
        referenceChainValid: true,
        statusCorrespondenceValid: true,
        amountDiscrepancyDetected: false,
        newDiscrepanciesDetected: [],
      },
      discrepancyResolved: false,
      validationReport: '修正後の金額が取引先の与信限度額を超過している。修正内容が承認基準を満たしません。',
    });

    const mockAiClient: Tx1Imp1AiClient = {
      executeOrchestratorLogic: jest.fn(),
    };

    const input = {
      targetMonthYearYYYYMM: '202401',
      executingUserId: 'user-001',
      currentDateTime: new Date('2024-02-05T10:30:00Z'),
    };

    await expect(runTx1Imp1Agent(input, mockAiClient)).rejects.toThrow('修正内容が承認基準を満たさないため、月次締めの承認ができません。');
  });
});
