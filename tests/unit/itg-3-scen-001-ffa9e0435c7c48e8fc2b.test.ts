import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { runTx1Imp1Agent } from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as authValidation from '../../src/logic/authorization-validation';
import * as dataRetrieval from '../../src/logic/legacy-new-system-data-retrieval';
import * as discrepancyDetection from '../../src/logic/discrepancy-detection-engine';
import * as dataIntegrityValidation from '../../src/logic/data-integrity-validation-engine';
import * as correctionValidation from '../../src/logic/correction-content-validation-engine';

describe('SCEN-001: 正常系：月次締め対象月のデータに異常がなく、修正も不要な場合、月次締めが自動承認される', () => {
  let mockAiClient: Tx1Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {};
  });

  it('should auto-approve monthly close when no anomalies detected and no corrections required', async () => {
    const targetMonthYearYYYYMM = '202401';
    const executingUserId = 'user-001';
    const currentDateTime = new Date('2024-02-05T10:00:00Z');

    // Mock validateUserAuthorizationForDiscrepancyConfirmation
    jest.spyOn(authValidation, 'validateUserAuthorizationForDiscrepancyConfirmation').mockResolvedValue({
      isAuthorized: true,
      userId: executingUserId,
      authorizedAt: '2024-02-05T10:00:00Z',
    } as any);

    // Mock retrieveLegacyAndNewSystemInvoiceData
    jest.spyOn(dataRetrieval, 'retrieveLegacyAndNewSystemInvoiceData').mockResolvedValue({
      legacyInvoices: [
        {
          invoiceId: 'inv-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-31',
          invoiceAmount: 500000,
          taxAmount: 50000,
          status: 'issued',
          dueDate: '2024-02-28',
        },
        {
          invoiceId: 'inv-002',
          invoiceNumber: 'INV-002',
          invoiceDate: '2024-01-28',
          invoiceAmount: 300000,
          taxAmount: 30000,
          status: 'issued',
          dueDate: '2024-02-27',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'inv-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-31',
          invoiceAmount: 500000,
          taxAmount: 50000,
          status: 'issued',
          dueDate: '2024-02-28',
        },
        {
          invoiceId: 'inv-002',
          invoiceNumber: 'INV-002',
          invoiceDate: '2024-01-28',
          invoiceAmount: 300000,
          taxAmount: 30000,
          status: 'issued',
          dueDate: '2024-02-27',
        },
      ],
      normalizedComparisonData: [],
      extractionTimestamp: '2024-02-05T10:00:00Z',
    } as any);

    // Mock detectDiscrepancies
    jest.spyOn(discrepancyDetection, 'detectDiscrepancies').mockResolvedValue({
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
    } as any);

    // Mock validateDataIntegrityForMonthlyClose
    jest.spyOn(dataIntegrityValidation, 'validateDataIntegrityForMonthlyClose').mockResolvedValue({
      validationResult: 'PASSED',
      totalDealsValidated: 2,
      totalInvoicesValidated: 2,
      referentialIntegrityViolations: [],
      statusCorrespondenceViolations: [],
      amountDiscrepancies: [],
      abnormalCasesList: [],
      executionTimestamp: currentDateTime,
    } as any);

    // Mock validateCorrectionContentAndJudgeApproval
    jest.spyOn(correctionValidation, 'validateCorrectionContentAndJudgeApproval').mockResolvedValue({
      validationResult: 'approved',
      correctionDifference: {},
      approvalCriteriaMet: true,
      integrityVerificationResult: {
        referenceChainValid: true,
        statusCorrespondenceValid: true,
        amountDiscrepancyDetected: false,
        newDiscrepanciesDetected: [],
      },
      discrepancyResolved: false,
      validationReport: 'No corrections required',
    } as any);

    const input = {
      targetMonthYearYYYYMM,
      executingUserId,
      currentDateTime,
    };

    const result = await runTx1Imp1Agent(input, mockAiClient);

    expect(result.approvalStatus).toBe('approved');
    expect(result.detectedAnomalies).toEqual([]);
    expect(result.notificationsSent).toEqual([]);
    expect(result.correctionValidationResults).toEqual([]);
    expect(result.approvalDecisionReason).toContain('自動承認');
  });
});
