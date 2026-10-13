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

describe('SCEN-010: 正常系：異常が検出されて許容範囲を超えているが修正済みの場合、月次締めが自動却下され例外案件として人による判定が必要と判定される', () => {
  it('approvalStatus=exception_escalated で返却される', async () => {
    (authValidation.validateUserAuthorizationForDiscrepancyConfirmation as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId: 'user-001',
      authorizedAt: '2024-02-15T10:30:00Z',
    });

    (legacyNewSystemData.retrieveLegacyAndNewSystemInvoiceData as jest.Mock).mockResolvedValue({
      legacyInvoices: [
        {
          invoiceId: 'LEGACY-INV-001',
          invoiceNumber: 'LEGACY-INV-001',
          invoiceDate: '2024-01-31',
          invoiceAmount: 950000,
          taxAmount: 95000,
          status: 'posted',
          dueDate: '2024-02-28',
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: 'INV-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2024-01-31',
          invoiceAmount: 1000000,
          taxAmount: 100000,
          status: 'issued',
          dueDate: '2024-02-28',
        },
      ],
      normalizedComparisonData: [],
      extractionTimestamp: '2024-02-15T10:30:00Z',
    });

    (discrepancyDetection.detectDiscrepancies as jest.Mock).mockResolvedValue({
      discrepancies: [
        {
          discrepancyId: 'DISC-001',
          legacyInvoiceId: 'LEGACY-INV-001',
          newSystemInvoiceId: 'INV-001',
          discrepancyType: 'AMOUNT_DIFFERENCE' as const,
          discrepancyContent: '請求金額が不一致',
          amountDifference: 50000,
          recordCountDifference: null,
          statusDifference: null,
          detectionTimestamp: '2024-02-10T09:00:00Z',
          severity: 'HIGH' as const,
          causeClassification: '旧システムの入力漏れ',
          toleranceJudgment: 'EXCEEDS_TOLERANCE' as const,
          judgmentTimestamp: '2024-02-10T09:00:00Z',
        },
      ],
      totalDiscrepancyCount: 1,
      criticalDiscrepancyCount: 0,
      exceedsToleranceCount: 1,
      summaryReport: {
        totalAmountDifference: 50000,
        totalRecordCountDifference: 0,
        statusInconsistencyCount: 0,
        detectionSummary: '差異1件検出：金額差異50000円（許容範囲超過）',
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
      executionTimestamp: new Date('2024-02-15T10:30:00Z'),
    });

    (correctionContentValidation.validateCorrectionContentAndJudgeApproval as jest.Mock).mockResolvedValue({
      validationResult: 'approved',
      correctionDifference: {
        invoiceAmount: { before: 950000, after: 1000000 },
      },
      approvalCriteriaMet: true,
      integrityVerificationResult: {
        referenceChainValid: true,
        statusCorrespondenceValid: true,
        amountDiscrepancyDetected: false,
        newDiscrepanciesDetected: [],
      },
      discrepancyResolved: true,
      validationReport: '修正されたレガシーシステム金額が新システム請求書金額と一致しました。差異は許容範囲内で解決されました。',
    });

    const mockAiClient: Tx1Imp1AiClient = {
      executeOrchestratorLogic: jest.fn(),
    };

    const input = {
      targetMonthYearYYYYMM: '202401',
      executingUserId: 'user-001',
      currentDateTime: new Date('2024-02-15T10:30:00Z'),
    };

    const result = await runTx1Imp1Agent(input, mockAiClient);

    expect(result.approvalStatus).toBe('exception_escalated');
    expect(result.detectedAnomalies).toHaveLength(1);
    expect(result.detectedAnomalies[0].anomalyType).toBe('invoice_amount_mismatch');
    expect(result.detectedAnomalies[0].affectedRecordCount).toBe(1);
    expect(result.detectedAnomalies[0].severity).toBe('high');
    expect(result.correctionValidationResults).toHaveLength(1);
    expect(result.correctionValidationResults[0].recordId).toBe('DISC-001');
    expect(result.correctionValidationResults[0].validationStatus).toBe('passed');
    expect(result.correctionValidationResults[0].validationDetails).toContain('修正されたレガシーシステム金額が新システム請求書金額と一致');
    expect(result.approvalDecisionReason).toContain('許容範囲を超える差異が検出されました');
    expect(result.approvalDecisionReason).toContain('例外案件として人による判定が必要です');
  });
});
