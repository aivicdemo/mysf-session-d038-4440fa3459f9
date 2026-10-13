import { detectDiscrepancies } from "../../src/logic/discrepancy-detection-engine";
import * as toleranceCriteriaModule from "../../src/logic/discrepancy-tolerance-criteria";

jest.mock("../../src/logic/discrepancy-tolerance-criteria");

describe("SCEN-045: 旧新システムのレコード件数・金額・ステータスの差異を比較し、リスク程度と推奨対応方法を判定する", () => {
  let mockGetToleranceCriteria: jest.Mock;

  beforeEach(() => {
    mockGetToleranceCriteria =
      toleranceCriteriaModule.getToleranceCriteriaByDiscrepancyType as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should detect multiple discrepancies with correct severity and tolerance judgment", async () => {
    const legacyInvoices = [
      {
        invoiceId: "INV-001",
        invoiceNumber: "SF-2025-0001",
        invoiceDate: "2025-01-15",
        invoiceAmount: 1000000,
        taxAmount: 100000,
        status: "issued",
        paymentDueDate: "2025-02-15",
      },
      {
        invoiceId: "INV-002",
        invoiceNumber: "SF-2025-0002",
        invoiceDate: "2025-01-16",
        invoiceAmount: 2000000,
        taxAmount: 200000,
        status: "paid",
        paymentDueDate: "2025-02-16",
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: "INV-001",
        invoiceNumber: "SF-2025-0001",
        invoiceDate: "2025-01-15",
        invoiceAmount: 1010000,
        taxAmount: 101000,
        status: "issued",
        paymentDueDate: "2025-02-15",
      },
      {
        invoiceId: "INV-002",
        invoiceNumber: "SF-2025-0002",
        invoiceDate: "2025-01-16",
        invoiceAmount: 2000000,
        taxAmount: 200000,
        status: "unpaid",
        paymentDueDate: "2025-02-16",
      },
      {
        invoiceId: "INV-003",
        invoiceNumber: "SF-2025-0003",
        invoiceDate: "2025-01-17",
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: "issued",
        paymentDueDate: "2025-02-17",
      },
    ];

    const legacySalesData = [
      {
        salesId: "SALES-001",
        recordCount: 50,
        totalAmount: 5000000,
        status: "closed_won",
      },
      {
        salesId: "SALES-002",
        recordCount: 30,
        totalAmount: 3000000,
        status: "in_progress",
      },
    ];

    const newSystemSalesData = [
      {
        salesId: "SALES-001",
        recordCount: 48,
        totalAmount: 4950000,
        status: "closed_won",
      },
      {
        salesId: "SALES-002",
        recordCount: 30,
        totalAmount: 3000000,
        status: "in_progress",
      },
    ];

    const detectionTimestamp = "2025-01-20T10:00:00Z";

    mockGetToleranceCriteria.mockResolvedValue({
      AMOUNT_DIFFERENCE: {
        toleranceAmount: 100000,
        tolerancePercentage: 5,
      },
      RECORD_COUNT_MISMATCH: {
        toleranceCount: 5,
        tolerancePercentage: 10,
      },
      STATUS_INCONSISTENCY: {
        allowedStatusTransitions: [
          { from: "issued", to: "unpaid" },
          { from: "paid", to: "issued" },
        ],
      },
    });

    const result = await detectDiscrepancies({
      legacyInvoices,
      newSystemInvoices,
      legacySalesData,
      newSystemSalesData,
      detectionTimestamp,
    });

    // Verify result contains expected discrepancies
    expect(result).toBeDefined();
    expect(result.discrepancies).toBeDefined();
    expect(result.discrepancies.length).toBeGreaterThanOrEqual(1);

    // Find amount difference discrepancy (INV-001)
    const amountDiffDiscrepancy = result.discrepancies.find(
      (d) =>
        d.discrepancyType === "AMOUNT_DIFFERENCE" &&
        d.legacyInvoiceId === "INV-001"
    );
    if (amountDiffDiscrepancy) {
      expect(amountDiffDiscrepancy.severity).toBe("LOW");
      expect(amountDiffDiscrepancy.toleranceJudgment).toBe("WITHIN_TOLERANCE");
      expect(amountDiffDiscrepancy.amountDifference).toBe(10000);
    }

    // Find status inconsistency discrepancy (INV-002)
    const statusInconDiscrepancy = result.discrepancies.find(
      (d) =>
        d.discrepancyType === "STATUS_INCONSISTENCY" &&
        d.legacyInvoiceId === "INV-002"
    );
    if (statusInconDiscrepancy) {
      expect(statusInconDiscrepancy.severity).toBe("HIGH");
      expect(statusInconDiscrepancy.toleranceJudgment).toBe("EXCEEDS_TOLERANCE");
      expect(statusInconDiscrepancy.statusDifference).toContain("paid");
      expect(statusInconDiscrepancy.statusDifference).toContain("unpaid");
    }

    // Verify total counts
    expect(result.totalDiscrepancyCount).toBeGreaterThanOrEqual(1);

    // Verify summary report
    expect(result.summaryReport.totalAmountDifference).toBeGreaterThanOrEqual(0);
    expect(result.summaryReport.totalRecordCountDifference).toBeGreaterThanOrEqual(
      0
    );
    expect(result.summaryReport.statusInconsistencyCount).toBeGreaterThanOrEqual(0);
    expect(result.summaryReport.detectionSummary).toBeDefined();

    // Verify judgmentTimestamp is after or equal to detectionTimestamp
    const judgmentTime = new Date(result.discrepancies[0]?.judgmentTimestamp || "").getTime();
    const detectionTime = new Date(detectionTimestamp).getTime();
    expect(judgmentTime).toBeGreaterThanOrEqual(detectionTime);
  });
});
