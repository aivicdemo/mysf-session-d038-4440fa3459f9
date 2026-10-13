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

describe('SCEN-006: エラー：修正が必要な案件について営業担当者による修正が完了していない場合、UnresolvedCorrectionError が発生する', () => {
  it('UnresolvedCorrectionError がスローされる', async () => {
    (authValidation.validateUserAuthorizationForDiscrepancyConfirmation as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      authorizedAt: '2024-02-05T10:30:00Z',
    });

    (legacyNewSystemData.retrieveLegacyAndNewSystemInvoiceData as jest.Mock).mockResolvedValue({
      legacyInvoices: [
        {
          invoiceId: 'inv-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-31',
          invoiceAmount: 1000000,
          taxAmount: 100000,
          status: 'issued',
          dueDate: '2024-02-28',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'inv-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-31',
          invoiceAmount: 1000000,
          taxAmount: 100000,
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
      correctionDifference: {},
      approvalCriteriaMet: false,
      integrityVerificationResult: {
        referenceChainValid: true,
        statusCorrespondenceValid: true,
        amountDiscrepancyDetected: false,
        newDiscrepanciesDetected: [],
      },
      discrepancyResolved: false,
      validationReport: '修正が完了していない',
    });

    const mockAiClient: Tx1Imp1AiClient = {
      executeOrchestratorLogic: jest.fn(),
    };

    const input = {
      targetMonthYearYYYYMM: '202401',
      executingUserId: 'user-001',
      currentDateTime: new Date('2024-02-05T10:30:00Z'),
    };

    await expect(runTx1Imp1Agent(input, mockAiClient)).rejects.toThrow('修正が必要な案件の修正が完了していないため、月次締めの承認ができません。');
  });
});
