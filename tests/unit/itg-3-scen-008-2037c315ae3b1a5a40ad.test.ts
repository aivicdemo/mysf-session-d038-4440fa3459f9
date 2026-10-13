import { jest } from '@jest/globals';
import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

jest.mock('../../src/logic/authorization-validation');
jest.mock('../../src/logic/legacy-new-system-data-retrieval');
jest.mock('../../src/logic/discrepancy-detection-engine');
jest.mock('../../src/logic/data-integrity-validation-engine');
jest.mock('../../src/logic/correction-content-validation-engine');

describe('itg-3-scen-008: DataIntegrityViolationError when referential integrity violation detected', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when referential integrity violation is detected', async () => {
    const targetMonthYearYYYYMM = '202401';
    const executingUserId = 'user-12345';
    const currentDateTime = new Date('2024-02-05T09:30:00Z');

    // Import mocked modules
    const authValidation = require('../../src/logic/authorization-validation');
    const dataRetrieval = require('../../src/logic/legacy-new-system-data-retrieval');
    const discrepancyDetection = require('../../src/logic/discrepancy-detection-engine');
    const dataIntegrityValidation = require('../../src/logic/data-integrity-validation-engine');
    const correctionValidation = require('../../src/logic/correction-content-validation-engine');

    // @ts-ignore
    authValidation.validateUserAuthorizationForDiscrepancyConfirmation = jest.fn().mockResolvedValue({
      isAuthorized: true,
      userId: 'user-12345',
      authorizedAt: '2024-02-05T09:25:00Z',
    });

    // @ts-ignore
    dataRetrieval.retrieveLegacyAndNewSystemInvoiceData = jest.fn().mockResolvedValue({
      legacyInvoices: [
        {
          invoiceId: 'INV-2024-0001',
          invoiceNumber: 'INV-0001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 150000,
          taxAmount: 15000,
          status: 'issued',
          dueDate: '2024-02-15',
          dealId: 'OPP-001',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'INV-2024-0001',
          invoiceNumber: 'INV-0001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 150000,
          taxAmount: 15000,
          status: 'issued',
          dueDate: '2024-02-15',
        },
      ],
      normalizedComparisonData: [],
      extractionTimestamp: '2024-02-05T09:25:00Z',
    });

    // @ts-ignore
    discrepancyDetection.detectDiscrepancies = jest.fn().mockResolvedValue({
      discrepancies: [],
      totalDiscrepancyCount: 0,
      criticalDiscrepancyCount: 0,
      exceedsToleranceCount: 0,
      summaryReport: {
        totalAmountDifference: 0,
        totalRecordCountDifference: 0,
        statusInconsistencyCount: 0,
        detectionSummary: 'No discrepancies detected',
      },
    });

    // @ts-ignore
    dataIntegrityValidation.validateDataIntegrityForMonthlyClose = jest.fn().mockResolvedValue({
      validationResult: 'FAILED_WITH_VIOLATIONS',
      totalDealsValidated: 1,
      totalInvoicesValidated: 1,
      referentialIntegrityViolations: [
        {
          dealId: null,
          invoiceId: 'INV-2024-0001',
          violationType: 'MISSING_REFERENCE',
          description: '請求書 INV-2024-0001 の参照先商談 OPP-001 がデータベースに存在しません',
        },
      ],
      statusCorrespondenceViolations: [],
      amountDiscrepancies: [],
      abnormalCasesList: [],
      executionTimestamp: new Date('2024-02-05T09:27:00Z'),
    });

    // @ts-ignore
    correctionValidation.validateCorrectionContentAndJudgeApproval = jest.fn().mockResolvedValue({
      validationResult: 'approved',
      correctionDifference: {},
      approvalCriteriaMet: true,
      integrityVerificationResult: {
        referenceChainValid: true,
        statusCorrespondenceValid: true,
        amountDiscrepancyDetected: false,
        newDiscrepanciesDetected: [],
      },
      discrepancyResolved: true,
      validationReport: '',
    });

    const mockAiClient: Tx1Imp1AiClient = {
      analyzeDataQuality: jest.fn(),
      judgeApprovalEligibility: jest.fn(),
    };

    // The error should be thrown
    await expect(
      runTx1Imp1Agent(
        {
          targetMonthYearYYYYMM,
          executingUserId,
          currentDateTime,
        },
        mockAiClient,
      ),
    ).rejects.toThrow();
  });
});
