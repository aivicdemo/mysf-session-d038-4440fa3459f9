import { detectDiscrepancies } from "../../src/logic/discrepancy-detection-engine";
import * as toleranceCriteriaModule from "../../src/logic/discrepancy-tolerance-criteria";

jest.mock("../../src/logic/discrepancy-tolerance-criteria");

describe("SCEN-044: マッチングできない請求書がある場合、警告が出力される", () => {
  let mockGetToleranceCriteria: jest.Mock;

  beforeEach(() => {
    mockGetToleranceCriteria =
      toleranceCriteriaModule.getToleranceCriteriaByDiscrepancyType as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should include unmatched invoice in discrepancies with HIGH severity and EXCEEDS_TOLERANCE judgment", async () => {
    const legacyInvoices = [
      {
        invoiceId: "INV-001",
        invoiceNumber: "2024-001",
        invoiceDate: "2024-01-15",
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: "issued",
        paymentDueDate: "2024-02-15",
      },
      {
        invoiceId: "INV-002",
        invoiceNumber: "2024-002",
        invoiceDate: "2024-01-20",
        invoiceAmount: 200000,
        taxAmount: 20000,
        status: "issued",
        paymentDueDate: "2024-02-20",
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: "NEW-INV-001",
        invoiceNumber: "2024-001",
        invoiceDate: "2024-01-15",
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: "issued",
        paymentDueDate: "2024-02-15",
      },
    ];

    const legacySalesData = [
      {
        salesId: "SALES-001",
        recordCount: 2,
        totalAmount: 300000,
        status: "active",
      },
    ];

    const newSystemSalesData = [
      {
        salesId: "SALES-001",
        recordCount: 1,
        totalAmount: 100000,
        status: "active",
      },
    ];

    const detectionTimestamp = "2024-01-25T10:00:00Z";

    mockGetToleranceCriteria.mockResolvedValue({
      AMOUNT_DIFFERENCE: {
        toleranceAmount: 5000,
        tolerancePercentage: 2,
      },
      RECORD_COUNT_MISMATCH: {
        toleranceCount: 1,
      },
      STATUS_INCONSISTENCY: {
        allowedStatusDifferences: [],
      },
    });

    const result = await detectDiscrepancies({
      legacyInvoices,
      newSystemInvoices,
      legacySalesData,
      newSystemSalesData,
      detectionTimestamp,
    });

    // Find the unmatched invoice discrepancy
    const unmatchedInvoiceDiscrepancy = result.discrepancies.find(
      (d) =>
        d.discrepancyType === "RECORD_COUNT_MISMATCH" &&
        d.discrepancyContent.includes("対応する請求書が見つかりません")
    );

    expect(unmatchedInvoiceDiscrepancy).toBeDefined();
    expect(unmatchedInvoiceDiscrepancy?.severity).toBe("HIGH");
    expect(unmatchedInvoiceDiscrepancy?.toleranceJudgment).toBe(
      "EXCEEDS_TOLERANCE"
    );
    expect(unmatchedInvoiceDiscrepancy?.causeClassification).toBe(
      "UNMATCHED_INVOICE"
    );

    // Verify total counts
    expect(result.totalDiscrepancyCount).toBeGreaterThanOrEqual(1);
    expect(result.exceedsToleranceCount).toBeGreaterThanOrEqual(1);

    // Verify summary report includes warning
    expect(result.summaryReport.detectionSummary).toContain("警告");
  });
});
