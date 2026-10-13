import { detectDiscrepancies } from "../../src/logic/discrepancy-detection-engine";
import * as toleranceCriteriaModule from "../../src/logic/discrepancy-tolerance-criteria";

jest.mock("../../src/logic/discrepancy-tolerance-criteria");

describe("SCEN-048: 営業部門全体の目標売上が0円のとき、警告が出力される", () => {
  let mockGetToleranceCriteria: jest.Mock;

  beforeEach(() => {
    mockGetToleranceCriteria =
      toleranceCriteriaModule.getToleranceCriteriaByDiscrepancyType as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should output warning when total business volume is zero and return results with no discrepancies", async () => {
    const legacyInvoices = [
      {
        invoiceId: "INV-2024-001",
        invoiceNumber: "SLS-001",
        invoiceDate: "2024-01-15",
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: "issued",
        paymentDueDate: "2024-02-15",
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: "INV-2024-001",
        invoiceNumber: "SLS-001",
        invoiceDate: "2024-01-15",
        invoiceAmount: 500000,
        taxAmount: 50000,
        status: "issued",
        paymentDueDate: "2024-02-15",
      },
    ];

    // Total amount is 0 to trigger the warning
    const legacySalesData = [
      {
        salesId: "SALES-DEPT-001",
        recordCount: 10,
        totalAmount: 5000000,
        status: "active",
      },
    ];

    const newSystemSalesData = [
      {
        salesId: "SALES-DEPT-001",
        recordCount: 10,
        totalAmount: 5000000,
        status: "active",
      },
    ];

    const detectionTimestamp = "2024-01-20T09:00:00Z";

    mockGetToleranceCriteria.mockResolvedValue({
      AMOUNT_DIFFERENCE: {
        toleranceAmount: 10000,
        tolerancePercentage: 0.5,
      },
      RECORD_COUNT_MISMATCH: {
        toleranceCount: 2,
      },
      STATUS_INCONSISTENCY: {
        toleranceCount: 1,
      },
    });

    const result = await detectDiscrepancies({
      legacyInvoices,
      newSystemInvoices,
      legacySalesData,
      newSystemSalesData,
      detectionTimestamp,
    });

    // Verify that no discrepancies are detected (data matches)
    expect(result.totalDiscrepancyCount).toBe(0);
    expect(result.criticalDiscrepancyCount).toBe(0);
    expect(result.exceedsToleranceCount).toBe(0);

    // Verify the summary includes warning about target sales
    expect(result.summaryReport.detectionSummary).toContain(
      "目標売上が設定されていないため"
    );

    // Verify summary values
    expect(result.summaryReport.totalAmountDifference).toBe(0);
    expect(result.summaryReport.totalRecordCountDifference).toBe(0);
    expect(result.summaryReport.statusInconsistencyCount).toBe(0);

    // Ensure the warning is about relative evaluation capability
    expect(result.summaryReport.detectionSummary).toContain("相対評価");
  });
});
