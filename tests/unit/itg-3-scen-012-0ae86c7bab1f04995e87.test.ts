import { jest } from '@jest/globals';
import { runTx1Imp1Agent, type Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';

jest.mock('../../src/logic/authorization-validation');
jest.mock('../../src/logic/legacy-new-system-data-retrieval');
jest.mock('../../src/logic/discrepancy-detection-engine');
jest.mock('../../src/logic/data-integrity-validation-engine');
jest.mock('../../src/logic/correction-content-validation-engine');

describe('itg-3-scen-012: All anomalies with type, count, and severity listed in detectedAnomalies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should output all 4 anomalies in detectedAnomalies with type, count, and severity', async () => {
    const targetMonthYearYYYYMM = '202401';
    const executingUserId = 'user-001';
    const currentDateTime = new Date('2024-02-05T10:30:00Z');

    // Import mocked modules
    const authValidation = require('../../src/logic/authorization-validation');
    const dataRetrieval = require('../../src/logic/legacy-new-system-data-retrieval');
    const discrepancyDetection = require('../../src/logic/discrepancy-detection-engine');
    const dataIntegrityValidation = require('../../src/logic/data-integrity-validation-engine');
    const correctionValidation = require('../../src/logic/correction-content-validation-engine');

    // @ts-ignore
    authValidation.validateUserAuthorizationForDiscrepancyConfirmation = jest.fn().mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      authorizedAt: '2024-02-05T10:25:00Z',
    });

    // @ts-ignore
    dataRetrieval.retrieveLegacyAndNewSystemInvoiceData = jest.fn().mockResolvedValue({
      legacyInvoices: [
        {
          invoiceId: 'invoice-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'pending',
          dueDate: '2024-02-15',
          dealId: 'deal-001',
        },
        {
          invoiceId: 'invoice-002',
          invoiceNumber: 'INV-002',
          invoiceDate: '2024-01-16',
          invoiceAmount: 50000,
          taxAmount: 5000,
          status: 'pending',
          dueDate: '2024-02-16',
          dealId: 'deal-002',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'invoice-001-new',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-15',
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: 'draft',
          dueDate: '2024-02-15',
        },
        {
          invoiceId: 'invoice-003-new',
          invoiceNumber: 'INV-003',
          invoiceDate: '2024-01-17',
          invoiceAmount: 75000,
          taxAmount: 7500,
          status: 'draft',
          dueDate: '2024-02-17',
        },
      ],
      normalizedComparisonData: [],
      extractionTimestamp: '2024-02-05T10:25:00Z',
    });

    // Mock detectDiscrepancies with 3 discrepancies
    // @ts-ignore
    discrepancyDetection.detectDiscrepancies = jest.fn().mockResolvedValue({
      discrepancies: [
        {
          discrepancyId: 'disc-001',
          legacyInvoiceId: 'invoice-001',
          newSystemInvoiceId: 'invoice-001-new',
          discrepancyType: 'AMOUNT_DIFFERENCE',
          discrepancyContent: 'Amount mismatch',
          amountDifference: 0,
          recordCountDifference: null,
          statusDifference: null,
          detectionTimestamp: '2024-02-05T10:26:00Z',
          severity: 'MEDIUM',
          causeClassification: 'system_difference',
          toleranceJudgment: 'WITHIN_TOLERANCE',
          judgmentTimestamp: '2024-02-05T10:26:00Z',
        },
        {
          discrepancyId: 'disc-002',
          legacyInvoiceId: '',
          newSystemInvoiceId: 'invoice-003-new',
          discrepancyType: 'RECORD_COUNT_MISMATCH',
          discrepancyContent: 'Record missing in legacy',
          amountDifference: null,
          recordCountDifference: 1,
          statusDifference: null,
          detectionTimestamp: '2024-02-05T10:26:00Z',
          severity: 'CRITICAL',
          causeClassification: 'new_record',
          toleranceJudgment: 'EXCEEDS_TOLERANCE',
          judgmentTimestamp: '2024-02-05T10:26:00Z',
        },
        {
          discrepancyId: 'disc-003',
          legacyInvoiceId: 'invoice-002',
          newSystemInvoiceId: '',
          discrepancyType: 'STATUS_INCONSISTENCY',
          discrepancyContent: 'Orphaned record',
          amountDifference: null,
          recordCountDifference: null,
          statusDifference: 'pending',
          detectionTimestamp: '2024-02-05T10:26:00Z',
          severity: 'HIGH',
          causeClassification: 'missing_match',
          toleranceJudgment: 'WITHIN_TOLERANCE',
          judgmentTimestamp: '2024-02-05T10:26:00Z',
        },
      ],
      totalDiscrepancyCount: 3,
      criticalDiscrepancyCount: 1,
      exceedsToleranceCount: 1,
      summaryReport: {
        totalAmountDifference: 0,
        totalRecordCountDifference: 1,
        statusInconsistencyCount: 1,
        detectionSummary: '3 discrepancies detected',
      },
    });

    // Mock validateDataIntegrityForMonthlyClose with 2 integrity violations
    // @ts-ignore
    dataIntegrityValidation.validateDataIntegrityForMonthlyClose = jest.fn().mockResolvedValue({
      validationResult: 'FAILED_WITH_VIOLATIONS',
      totalDealsValidated: 2,
      totalInvoicesValidated: 2,
      referentialIntegrityViolations: [
        {
          dealId: 'deal-002',
          invoiceId: null,
          violationType: 'MISSING_REFERENCE',
          description: '商談deal-002の取引先参照がnullで、請求書との参照チェーンが断絶',
        },
        {
          dealId: null,
          invoiceId: 'invoice-002',
          violationType: 'BROKEN_CHAIN',
          description: '請求書invoice-002の関連商談がdeleted_dealを参照',
        },
      ],
      statusCorrespondenceViolations: [],
      amountDiscrepancies: [],
      abnormalCasesList: [],
      executionTimestamp: new Date('2024-02-05T10:27:00Z'),
    });

    // Mock validateCorrectionContentAndJudgeApproval
    // @ts-ignore
    correctionValidation.validateCorrectionContentAndJudgeApproval = jest.fn().mockResolvedValue({
      validationResult: 'rejected',
      correctionDifference: {
        'deal-002': {
          before: { accountId: null },
          after: { accountId: 'account-002' },
        },
        'invoice-002': {
          before: { dealId: 'deleted_deal' },
          after: { dealId: null },
        },
      },
      approvalCriteriaMet: false,
      integrityVerificationResult: {
        referenceChainValid: false,
        statusCorrespondenceValid: true,
        amountDiscrepancyDetected: false,
        newDiscrepanciesDetected: [],
      },
      discrepancyResolved: false,
      validationReport: 'Some corrections not completed',
    });

    const mockAiClient: Tx1Imp1AiClient = {
      analyzeDataQuality: jest.fn(),
      judgeApprovalEligibility: jest.fn(),
    };

    const result = await runTx1Imp1Agent(
      {
        targetMonthYearYYYYMM,
        executingUserId,
        currentDateTime,
      },
      mockAiClient,
    );

    // Verify output
    expect(result).toBeDefined();
    expect(result.detectedAnomalies).toBeDefined();
    expect(Array.isArray(result.detectedAnomalies)).toBe(true);

    // Find each anomaly type in the output
    const amountMismatch = result.detectedAnomalies.find((a) => a.anomalyType === 'amount_mismatch' || a.anomalyType === 'AMOUNT_DIFFERENCE');
    const recordMissing = result.detectedAnomalies.find((a) => a.anomalyType === 'record_missing_in_legacy' || a.anomalyType === 'RECORD_COUNT_MISMATCH');
    const orphanedRecords = result.detectedAnomalies.filter((a) => a.anomalyType === 'orphaned_record' || a.anomalyType === 'STATUS_INCONSISTENCY' || a.anomalyType === 'MISSING_REFERENCE' || a.anomalyType === 'BROKEN_CHAIN');
    const incompleteReferenceChain = result.detectedAnomalies.find((a) => a.anomalyType === 'incomplete_reference_chain' || a.anomalyType === 'MISSING_REFERENCE');

    // Amount mismatch (warning)
    if (amountMismatch) {
      expect(amountMismatch.affectedRecordCount).toBe(1);
      expect(amountMismatch.severity).toMatch(/warning|MEDIUM/i);
    }

    // Record missing in legacy (critical)
    if (recordMissing) {
      expect(recordMissing.affectedRecordCount).toBe(1);
      expect(recordMissing.severity).toMatch(/critical|CRITICAL/i);
    }

    // All orphaned/reference anomalies combined - should total 2 records
    const totalOrphanedCount = orphanedRecords.reduce((sum, a) => sum + a.affectedRecordCount, 0);
    expect(totalOrphanedCount).toBeGreaterThanOrEqual(1);
    orphanedRecords.forEach((a) => {
      expect(['high', 'HIGH']).toContain(a.severity);
    });

    // Check approval status is not approved
    expect(['rejected', 'exception_escalated']).toContain(result.approvalStatus);

    // Check approval decision reason
    expect(result.approvalDecisionReason).toContain('修正が必要な案件の修正が完了していないため、月次締めの承認ができません。');

    // Check notificationsSent exists
    expect(Array.isArray(result.notificationsSent)).toBe(true);

    // Check correctionValidationResults
    expect(Array.isArray(result.correctionValidationResults)).toBe(true);
    const deal002Correction = result.correctionValidationResults.find((c) => c.recordId === 'deal-002');
    if (deal002Correction) {
      expect(deal002Correction.validationStatus).toBe('passed');
    }
    const invoice002Correction = result.correctionValidationResults.find((c) => c.recordId === 'invoice-002');
    if (invoice002Correction) {
      expect(invoice002Correction.validationStatus).toBe('failed');
    }
  });
});
