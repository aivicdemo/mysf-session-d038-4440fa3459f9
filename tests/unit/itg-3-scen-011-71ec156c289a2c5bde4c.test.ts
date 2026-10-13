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

describe("SCEN-011: 異常検出時に営業担当者へ修正通知が送信され、通知送信結果が出力に含まれる", () => {
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

  it("should send notifications to multiple sales users and include them in the output", async () => {
    const targetMonthYearYYYYMM = "202401";
    const executingUserId = "user-001";
    const currentDateTime = new Date("2024-02-15T10:00:00Z");

    mockAuthValidation.mockResolvedValue({
      isAuthorized: true,
      userId: "user-001",
      authorizedAt: "2024-02-15T10:00:00Z",
    });

    mockDataRetrieval.mockResolvedValue({
      legacyInvoices: [
        {
          invoiceId: "INV-2024-001",
          invoiceNumber: "INV-2024-001",
          invoiceDate: "2024-01-15",
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: "issued",
          dueDate: "2024-02-15",
        },
        {
          invoiceId: "INV-2024-002",
          invoiceNumber: "INV-2024-002",
          invoiceDate: "2024-01-16",
          invoiceAmount: 50000,
          taxAmount: 5000,
          status: "draft",
          dueDate: "2024-02-20",
        },
      ],
      newSystemInvoices: [
        {
          invoiceId: "INV-2024-001",
          invoiceNumber: "INV-2024-001",
          invoiceDate: "2024-01-15",
          invoiceAmount: 100000,
          taxAmount: 10000,
          status: "issued",
          dueDate: "2024-02-15",
        },
        {
          invoiceId: "INV-2024-002",
          invoiceNumber: "INV-2024-002",
          invoiceDate: "2024-01-16",
          invoiceAmount: 55000,
          taxAmount: 5500,
          status: "issued",
          dueDate: "2024-02-20",
        },
      ],
      normalizedComparisonData: [],
      extractionTimestamp: "2024-02-15T10:00:00Z",
    });

    mockDetectDiscrepancies.mockResolvedValue({
      discrepancies: [
        {
          discrepancyId: "disc-002",
          legacyInvoiceId: "INV-2024-002",
          newSystemInvoiceId: "INV-2024-002",
          discrepancyType: "AMOUNT_DIFFERENCE",
          discrepancyContent: "Invoice amount mismatch between systems",
          amountDifference: 5000,
          recordCountDifference: null,
          statusDifference: null,
          detectionTimestamp: "2024-02-15T10:00:00Z",
          severity: "HIGH",
          causeClassification: "system_sync_issue",
          toleranceJudgment: "EXCEEDS_TOLERANCE",
          judgmentTimestamp: "2024-02-15T10:00:00Z",
        },
      ],
      totalDiscrepancyCount: 1,
      criticalDiscrepancyCount: 0,
      exceedsToleranceCount: 1,
      summaryReport: {
        totalAmountDifference: 5000,
        totalRecordCountDifference: 0,
        statusInconsistencyCount: 0,
        detectionSummary: "1 high-severity discrepancy exceeds tolerance",
      },
    });

    mockValidateIntegrity.mockResolvedValue({
      validationResult: "PASSED",
      totalDealsValidated: 2,
      totalInvoicesValidated: 2,
      referentialIntegrityViolations: [],
      statusCorrespondenceViolations: [],
      amountDiscrepancies: [],
      abnormalCasesList: [
        {
          caseId: "case-002",
          dealId: "OPP-002",
          invoiceId: null,
          violationTypes: ["incomplete_opportunity"],
          severity: "MEDIUM",
          correctionRequired: true,
          assignedTo: "sales-user-001",
        },
        {
          caseId: "case-003",
          dealId: "OPP-003",
          invoiceId: null,
          violationTypes: ["incomplete_opportunity"],
          severity: "MEDIUM",
          correctionRequired: true,
          assignedTo: "sales-user-002",
        },
      ],
      executionTimestamp: currentDateTime,
    });

    mockValidateCorrection.mockResolvedValue({
      validationResult: "approved",
      correctionDifference: {
        invoiceAmount: {
          before: 50000,
          after: 55000,
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
      validationReport:
        "修正後のデータが承認基準を満たしています。旧システム金額55000円に統一、摘要欄に修正日時を記録。",
    });

    const mockAiClient: Tx1Imp1AiClient = {
      sendNotifications: jest.fn(),
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

    expect(result.approvalStatus).toBe("approved");

    expect(result.detectedAnomalies).toContainEqual(
      expect.objectContaining({
        anomalyType: "incomplete_opportunity",
        affectedRecordCount: 2,
        severity: "medium",
      })
    );

    expect(result.notificationsSent).toHaveLength(2);
    const notificationUserIds = result.notificationsSent.map((n) => n.recipientUserId);
    expect(notificationUserIds).toContain("sales-user-001");
    expect(notificationUserIds).toContain("sales-user-002");

    result.notificationsSent.forEach((notification) => {
      expect(notification.notificationType).toBe("difference_alert");
      expect(notification.sentDateTime.getTime()).toBeGreaterThanOrEqual(currentDateTime.getTime());
    });

    expect(result.correctionValidationResults).toContainEqual(
      expect.objectContaining({
        recordId: "INV-2024-002",
        validationStatus: "passed",
        validationDetails:
          "修正後のデータが承認基準を満たしています。旧システム金額55000円に統一、摘要欄に修正日時を記録。",
      })
    );

    expect(result.approvalDecisionReason).toContain("検出された異常値");
    expect(result.approvalDecisionReason).toContain("営業担当者による修正");
    expect(result.approvalDecisionReason).toContain("自動承認");
  });
});
