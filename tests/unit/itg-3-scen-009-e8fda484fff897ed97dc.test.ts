import { runTx1Imp1Agent, Tx1Imp1AiClient } from "../../src/agents/tx-1-imp-1/orchestrator";
import * as authModule from "../../src/logic/authorization-validation";
import * as dataRetrievalModule from "../../src/logic/legacy-new-system-data-retrieval";
import * as discrepancyModule from "../../src/logic/discrepancy-detection-engine";
import * as integrityModule from "../../src/logic/data-integrity-validation-engine";
import * as correctionModule from "../../src/logic/correction-content-validation-engine";

jest.mock("../../src/logic/authorization-validation");
jest.mock("../../src/logic/legacy-new-system-data-retrieval");
jest.mock("../../src/logic/discrepancy-detection-engine");
jest.mock("../../src/logic/data-integrity-validation-engine");
jest.mock("../../src/logic/correction-content-validation-engine");

describe("SCEN-009: 異常が許容範囲内で、修正内容が承認基準を満たす場合、月次締めが自動承認される", () => {
  let mockAuthValidation: jest.Mock;
  let mockDataRetrieval: jest.Mock;
  let mockDetectDiscrepancies: jest.Mock;
  let mockValidateIntegrity: jest.Mock;
  let mockValidateCorrection: jest.Mock;

  beforeEach(() => {
    mockAuthValidation = authModule.validateUserAuthorizationForDiscrepancyConfirmation as jest.Mock;
    mockDataRetrieval = dataRetrievalModule.retrieveLegacyAndNewSystemInvoiceData as jest.Mock;
    mockDetectDiscrepancies = discrepancyModule.detectDiscrepancies as jest.Mock;
    mockValidateIntegrity = integrityModule.validateDataIntegrityForMonthlyClose as jest.Mock;
    mockValidateCorrection = correctionModule.validateCorrectionContentAndJudgeApproval as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return approved status with detected anomalies and correction validation results", async () => {
    const targetMonthYearYYYYMM = "202401";
    const executingUserId = "user-001";
    const currentDateTime = new Date("2024-02-05T10:00:00Z");

    // Setup preconditions based on test specification
    mockAuthValidation.mockResolvedValue({
      isAuthorized: true,
      userId: "user-001",
      authorizedAt: "2024-02-05T10:00:00Z",
    });

    mockDataRetrieval.mockResolvedValue({
      legacyInvoices: [
        {
          invoiceId: "inv-001",
          invoiceNumber: "INV-2024-001",
          invoiceDate: "2024-01-15",
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: "issued",
          dueDate: "2024-02-15",
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: "inv-001",
          invoiceNumber: "INV-2024-001",
          invoiceDate: "2024-01-15",
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: "issued",
          dueDate: "2024-02-15",
        },
      ],
      normalizedComparisonData: [],
      extractionTimestamp: "2024-02-05T10:00:00Z",
    });

    mockDetectDiscrepancies.mockResolvedValue({
      discrepancies: [
        {
          discrepancyId: "disc-001",
          legacyInvoiceId: "inv-001",
          newSystemInvoiceId: "inv-001",
          discrepancyType: "AMOUNT_DIFFERENCE",
          discrepancyContent: "請求金額の差異が許容範囲内",
          amountDifference: 0,
          recordCountDifference: null,
          statusDifference: null,
          detectionTimestamp: "2024-02-05T10:00:00Z",
          severity: "LOW",
          causeClassification: "normal",
          toleranceJudgment: "WITHIN_TOLERANCE",
          judgmentTimestamp: "2024-02-05T10:00:00Z",
        },
      ],
      totalDiscrepancyCount: 1,
      criticalDiscrepancyCount: 0,
      exceedsToleranceCount: 0,
      summaryReport: {
        totalAmountDifference: 0,
        totalRecordCountDifference: 0,
        statusInconsistencyCount: 0,
        detectionSummary: "1 minor discrepancy detected within tolerance",
      },
    });

    mockValidateIntegrity.mockResolvedValue({
      validationResult: "PASSED",
      totalDealsValidated: 1,
      totalInvoicesValidated: 1,
      referentialIntegrityViolations: [],
      statusCorrespondenceViolations: [],
      amountDiscrepancies: [],
      abnormalCasesList: [
        {
          caseId: "case-001",
          dealId: "opp-001",
          invoiceId: "inv-001",
          violationTypes: ["incomplete_opportunity"],
          severity: "MEDIUM",
          correctionRequired: true,
          assignedTo: "user-sales-001",
        },
      ],
      executionTimestamp: currentDateTime,
    });

    mockValidateCorrection.mockResolvedValue({
      validationResult: "approved",
      correctionDifference: {
        status: {
          before: "incomplete",
          after: "completed",
        },
      },
      approvalCriteriaMet: true,
      integrityVerificationResult: {
        referenceChainValid: true,
        statusCorrespondenceValid: true,
        amountDiscrepancyDetected: false,
        newDiscrepanciesDetected: [],
      },
      discrepancyResolved: true,
      validationReport: "修正内容が承認基準を満たしています",
    });

    const mockAiClient: Tx1Imp1AiClient = {
      analyzeAnomalies: jest.fn(),
    };

    const result = await runTx1Imp1Agent(
      {
        targetMonthYearYYYYMM,
        executingUserId,
        currentDateTime,
      },
      mockAiClient
    );

    // Verify expected results
    expect(result.approvalStatus).toBe("approved");

    expect(result.detectedAnomalies).toContainEqual(
      expect.objectContaining({
        anomalyType: "incomplete_opportunity",
        affectedRecordCount: 1,
        severity: "medium",
      })
    );

    expect(result.notificationsSent).toHaveLength(1);
    expect(result.notificationsSent[0]).toEqual(
      expect.objectContaining({
        recipientUserId: "user-sales-001",
        notificationType: "correction_required",
      })
    );

    expect(result.correctionValidationResults).toContainEqual(
      expect.objectContaining({
        recordId: "opp-001",
        validationStatus: "passed",
        validationDetails: "修正内容が承認基準を満たしています",
      })
    );

    expect(result.approvalDecisionReason).toEqual(
      "異常値は検出されたが許容範囲内であり、営業担当者による修正内容が承認基準を満たしています"
    );
  });
});
