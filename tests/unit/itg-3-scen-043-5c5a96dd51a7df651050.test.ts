import { detectDiscrepancies } from "../../src/logic/discrepancy-detection-engine";
import * as toleranceCriteriaModule from "../../src/logic/discrepancy-tolerance-criteria";

jest.mock("../../src/logic/discrepancy-tolerance-criteria");

describe("SCEN-043: 許容範囲の値が負数の場合、エラーで throw される", () => {
  let mockGetToleranceCriteria: jest.Mock;

  beforeEach(() => {
    mockGetToleranceCriteria =
      toleranceCriteriaModule.getToleranceCriteriaByDiscrepancyType as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw ToleranceCriteriaNotFound error when tolerance criteria has negative value", async () => {
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
    ];

    const newSystemInvoices = [
      {
        invoiceId: "INV-001",
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
        recordCount: 5,
        totalAmount: 500000,
        status: "completed",
      },
    ];

    const newSystemSalesData = [
      {
        salesId: "SALES-001",
        recordCount: 5,
        totalAmount: 500000,
        status: "completed",
      },
    ];

    const detectionTimestamp = "2024-01-20T10:00:00Z";

    // Mock that returns tolerance criteria with negative tolerance value
    mockGetToleranceCriteria.mockResolvedValue({
      toleranceAmount: -1000, // Negative tolerance value
      tolerancePercentage: 2,
    });

    // The function should throw an error when tolerance criteria has negative value
    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow();

    // Verify the error is related to tolerance criteria
    try {
      await detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      });
    } catch (error) {
      expect(error).toBeDefined();
      const errorMessage = (error as Error).message;
      expect(
        errorMessage.includes("許容") ||
          errorMessage.includes("ToleranceCriteria") ||
          errorMessage.includes("負数")
      ).toBe(true);
    }
  });
});
