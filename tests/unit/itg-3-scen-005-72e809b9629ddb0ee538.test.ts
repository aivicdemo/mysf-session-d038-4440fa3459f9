import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  runTx1Imp1Agent,
} from '../../src/agents/tx-1-imp-1/orchestrator';
import type { Tx1Imp1AiClient } from '../../src/agents/tx-1-imp-1/orchestrator';
import * as authValidation from '../../src/logic/authorization-validation';
import * as dataRetrieval from '../../src/logic/legacy-new-system-data-retrieval';
import * as discrepancyDetection from '../../src/logic/discrepancy-detection-engine';

describe('SCEN-005: エラー：許容範囲を超える重大な差異が検出された場合、CriticalDiscrepancyDetectedError が発生し例外案件として人による判定が必要と判定される', () => {
  let mockAiClient: Tx1Imp1AiClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiClient = {};
  });

  it('should throw CriticalDiscrepancyDetectedError when critical discrepancy exceeds tolerance threshold', async () => {
    const targetMonthYearYYYYMM = '202401';
    const executingUserId = 'user-001';
    const currentDateTime = new Date('2024-02-05T10:30:00Z');

    // Mock validateUserAuthorizationForDiscrepancyConfirmation
    jest.spyOn(authValidation, 'validateUserAuthorizationForDiscrepancyConfirmation').mockResolvedValue({
      isAuthorized: true,
      userId: executingUserId,
      authorizedAt: '2024-02-05T10:30:00Z',
    } as any);

    // Mock retrieveLegacyAndNewSystemInvoiceData
    jest.spyOn(dataRetrieval, 'retrieveLegacyAndNewSystemInvoiceData').mockResolvedValue({
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
          invoiceAmount: 900000,
          taxAmount: 90000,
          status: 'issued',
          dueDate: '2024-02-28',
        },
      ],
      normalizedComparisonData: [],
      extractionTimestamp: '2024-02-05T10:30:00Z',
    } as any);

    // Mock detectDiscrepancies to return critical discrepancy exceeding tolerance
    jest.spyOn(discrepancyDetection, 'detectDiscrepancies').mockResolvedValue({
      discrepancies: [
        {
          discrepancyId: 'disc-001',
          legacyInvoiceId: 'inv-001',
          newSystemInvoiceId: 'inv-001',
          discrepancyType: 'AMOUNT_DIFFERENCE',
          discrepancyContent: 'Invoice amount mismatch: 1000000 vs 900000',
          amountDifference: 100000,
          recordCountDifference: null,
          statusDifference: null,
          detectionTimestamp: '2024-02-05T10:30:00Z',
          severity: 'CRITICAL',
          causeClassification: 'System sync failure',
          toleranceJudgment: 'EXCEEDS_TOLERANCE',
          judgmentTimestamp: '2024-02-05T10:30:00Z',
        },
      ],
      totalDiscrepancyCount: 1,
      criticalDiscrepancyCount: 1,
      exceedsToleranceCount: 1,
      summaryReport: {
        totalAmountDifference: 100000,
        totalRecordCountDifference: 0,
        statusInconsistencyCount: 0,
        detectionSummary: 'Critical discrepancy detected exceeding tolerance threshold of 50000',
      },
    } as any);

    const input = {
      targetMonthYearYYYYMM,
      executingUserId,
      currentDateTime,
    };

    await expect(runTx1Imp1Agent(input, mockAiClient)).rejects.toThrow('CriticalDiscrepancyDetectedError');
    await expect(runTx1Imp1Agent(input, mockAiClient)).rejects.toThrow(
      '許容範囲を超える重大な差異が検出されたため、月次締めの自動承認ができません。例外案件として人による判定が必要です。'
    );
  });
});
