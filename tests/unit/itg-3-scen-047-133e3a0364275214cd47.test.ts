import { detectDiscrepancies, NewSystemInvoiceDataMissing } from "../../src/logic/discrepancy-detection-engine";
import * as toleranceCriteriaModule from "../../src/logic/discrepancy-tolerance-criteria";

jest.mock("../../src/logic/discrepancy-tolerance-criteria");

describe("SCEN-047: 新システムのレコード件数が0件のとき、エラーで throw される", () => {
  let mockGetToleranceCriteria: jest.Mock;

  beforeEach(() => {
    mockGetToleranceCriteria =
      toleranceCriteriaModule.getToleranceCriteriaByDiscrepancyType as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw NewSystemInvoiceDataMissing error when new system invoice data is empty", async () => {
    const legacyInvoices = [
      {
        invoiceId: "INV-001",
        invoiceNumber: "INV20240101001",
        invoiceDate: "2024-01-01",
        invoiceAmount: 100000,
        taxAmount: 10000,
        status: "issued",
        paymentDueDate: "2024-02-01",
      },
    ];

    const newSystemInvoices: Array<{
      invoiceId: string;
      invoiceNumber: string;
      invoiceDate: string;
      invoiceAmount: number;
      taxAmount: number;
      status: string;
      paymentDueDate: string;
    }> = [];

    const legacySalesData = [
      {
        salesId: "SALES-001",
        recordCount: 5,
        totalAmount: 500000,
        status: "active",
      },
    ];

    const newSystemSalesData = [
      {
        salesId: "SALES-001",
        recordCount: 5,
        totalAmount: 500000,
        status: "active",
      },
    ];

    const detectionTimestamp = "2024-01-15T10:00:00Z";

    mockGetToleranceCriteria.mockResolvedValue({
      AMOUNT_DIFFERENCE: { tolerance: 1000 },
      RECORD_COUNT_MISMATCH: { tolerance: 1 },
      STATUS_INCONSISTENCY: { tolerance: 0 },
    });

    // Should throw NewSystemInvoiceDataMissing error
    await expect(
      detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      })
    ).rejects.toThrow(NewSystemInvoiceDataMissing);

    // Verify the error message matches the business rule
    try {
      await detectDiscrepancies({
        legacyInvoices,
        newSystemInvoices,
        legacySalesData,
        newSystemSalesData,
        detectionTimestamp,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(NewSystemInvoiceDataMissing);
      const errorMessage = (error as Error).message;
      expect(errorMessage).toContain("新システム請求書データが取得できていません");
    }
  });
});
